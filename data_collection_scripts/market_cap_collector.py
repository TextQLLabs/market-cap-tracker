#!/usr/bin/env python3
"""
Market Cap Data Collection System
Automated data collection for filling missing market cap data points
"""

import pandas as pd
import requests
import time
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import yfinance as yf
from dataclasses import dataclass
import os


@dataclass
class MarketCapData:
    """Data structure for market cap information"""
    year: int
    market_cap: float
    citation: str
    notes: str
    confidence_level: str = "MEDIUM"
    last_verified: str = ""
    source_type: str = ""


class APIRateLimiter:
    """Manages API rate limiting across different sources"""
    
    def __init__(self):
        self.call_counts = {}
        self.last_call_time = {}
        self.rate_limits = {
            'alpha_vantage': {'calls_per_minute': 5, 'daily_limit': 500},
            'yahoo_finance': {'calls_per_minute': 60, 'daily_limit': None},
            'sec_edgar': {'calls_per_minute': 10, 'daily_limit': None}
        }
    
    def can_make_call(self, api_name: str) -> bool:
        """Check if we can make an API call within rate limits"""
        if api_name not in self.rate_limits:
            return True
            
        now = datetime.now()
        limits = self.rate_limits[api_name]
        
        # Check daily limit
        if limits['daily_limit']:
            today_calls = self.call_counts.get(f"{api_name}_{now.date()}", 0)
            if today_calls >= limits['daily_limit']:
                return False
        
        # Check per-minute limit
        last_call = self.last_call_time.get(api_name)
        if last_call:
            time_diff = (now - last_call).total_seconds()
            if time_diff < 60 / limits['calls_per_minute']:
                return False
                
        return True
    
    def record_call(self, api_name: str):
        """Record that an API call was made"""
        now = datetime.now()
        self.last_call_time[api_name] = now
        
        # Update daily count
        day_key = f"{api_name}_{now.date()}"
        self.call_counts[day_key] = self.call_counts.get(day_key, 0) + 1
    
    def wait_if_needed(self, api_name: str):
        """Wait if necessary to respect rate limits"""
        if not self.can_make_call(api_name):
            wait_time = 60 / self.rate_limits[api_name]['calls_per_minute']
            logging.info(f"Rate limit reached for {api_name}, waiting {wait_time} seconds")
            time.sleep(wait_time)


class AlphaVantageAPI:
    """Alpha Vantage API integration for market cap data"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://www.alphavantage.co/query"
        
    def get_market_cap_data(self, symbol: str, year: int) -> Optional[MarketCapData]:
        """Get market cap data for a specific year"""
        try:
            # Get time series data
            params = {
                'function': 'TIME_SERIES_MONTHLY',
                'symbol': symbol,
                'apikey': self.api_key
            }
            
            response = requests.get(self.base_url, params=params)
            data = response.json()
            
            if 'Error Message' in data:
                logging.error(f"Alpha Vantage error for {symbol}: {data['Error Message']}")
                return None
                
            if 'Note' in data:
                logging.warning(f"Alpha Vantage rate limit hit: {data['Note']}")
                return None
            
            # Find data for the target year
            time_series = data.get('Monthly Time Series', {})
            
            # Look for December data of the target year
            target_date = f"{year}-12"
            matching_dates = [date for date in time_series.keys() if date.startswith(target_date)]
            
            if not matching_dates:
                return None
            
            # Get the latest date in December of target year
            latest_date = max(matching_dates)
            price_data = time_series[latest_date]
            close_price = float(price_data['4. close'])
            
            # Get shares outstanding (requires separate API call)
            market_cap = self._calculate_market_cap(symbol, close_price, year)
            
            if market_cap:
                return MarketCapData(
                    year=year,
                    market_cap=market_cap,
                    citation=f"Alpha Vantage API - {latest_date}",
                    notes=f"Calculated from closing price ${close_price} on {latest_date}",
                    confidence_level="HIGH",
                    last_verified=datetime.now().strftime("%Y-%m-%d"),
                    source_type="API"
                )
                
        except Exception as e:
            logging.error(f"Error getting Alpha Vantage data for {symbol} {year}: {e}")
            
        return None
    
    def _calculate_market_cap(self, symbol: str, price: float, year: int) -> Optional[float]:
        """Calculate market cap from price and shares outstanding"""
        try:
            # Get company overview for shares outstanding
            params = {
                'function': 'OVERVIEW',
                'symbol': symbol,
                'apikey': self.api_key
            }
            
            response = requests.get(self.base_url, params=params)
            data = response.json()
            
            shares_outstanding = data.get('SharesOutstanding')
            if shares_outstanding:
                shares = float(shares_outstanding)
                market_cap = (price * shares) / 1_000_000_000  # Convert to billions
                return round(market_cap, 2)
                
        except Exception as e:
            logging.error(f"Error calculating market cap for {symbol}: {e}")
            
        return None


class YahooFinanceAPI:
    """Yahoo Finance API integration using yfinance"""
    
    def get_market_cap_data(self, symbol: str, year: int) -> Optional[MarketCapData]:
        """Get market cap data for a specific year"""
        try:
            stock = yf.Ticker(symbol)
            
            # Get historical data for the target year
            start_date = f"{year}-01-01"
            end_date = f"{year}-12-31"
            
            hist = stock.history(start=start_date, end=end_date)
            
            if hist.empty:
                return None
            
            # Get year-end price (last trading day of the year)
            year_end_price = hist['Close'].iloc[-1]
            year_end_date = hist.index[-1].strftime("%Y-%m-%d")
            
            # Get current info to calculate shares outstanding
            info = stock.info
            shares_outstanding = info.get('sharesOutstanding')
            
            if shares_outstanding:
                market_cap = (year_end_price * shares_outstanding) / 1_000_000_000
                
                return MarketCapData(
                    year=year,
                    market_cap=round(market_cap, 2),
                    citation=f"Yahoo Finance API - {year_end_date}",
                    notes=f"Calculated from closing price ${year_end_price:.2f} on {year_end_date}",
                    confidence_level="HIGH",
                    last_verified=datetime.now().strftime("%Y-%m-%d"),
                    source_type="API"
                )
            
        except Exception as e:
            logging.error(f"Error getting Yahoo Finance data for {symbol} {year}: {e}")
            
        return None


class SECEdgarAPI:
    """SEC EDGAR integration for official filing data"""
    
    def __init__(self):
        self.base_url = "https://www.sec.gov/Archives/edgar/data"
        
    def get_market_cap_data(self, cik: str, symbol: str, year: int) -> Optional[MarketCapData]:
        """Get market cap from SEC filings for a specific year"""
        try:
            # This is a simplified implementation
            # Full implementation would parse 10-K filings for balance sheet data
            
            # For now, return None to indicate manual research needed
            return None
            
        except Exception as e:
            logging.error(f"Error getting SEC data for {symbol} {year}: {e}")
            
        return None


class DataValidator:
    """Validates collected market cap data for reasonableness"""
    
    def __init__(self):
        self.validation_rules = {
            'growth_rate': self._validate_growth_rate,
            'minimum_value': self._validate_minimum_value,
            'historical_context': self._validate_historical_context
        }
    
    def validate_data(self, company_data: List[MarketCapData]) -> List[Tuple[MarketCapData, List[str]]]:
        """Validate a list of market cap data points"""
        results = []
        
        for data_point in company_data:
            issues = []
            
            for rule_name, rule_function in self.validation_rules.items():
                try:
                    if not rule_function(data_point, company_data):
                        issues.append(f"Failed {rule_name} validation")
                except Exception as e:
                    issues.append(f"Error in {rule_name} validation: {e}")
            
            results.append((data_point, issues))
        
        return results
    
    def _validate_growth_rate(self, data_point: MarketCapData, all_data: List[MarketCapData]) -> bool:
        """Check if growth rate is reasonable compared to adjacent years"""
        # Find adjacent years
        year = data_point.year
        prev_year_data = next((d for d in all_data if d.year == year - 1), None)
        next_year_data = next((d for d in all_data if d.year == year + 1), None)
        
        # Check growth rates (allow up to 10x growth in a single year)
        if prev_year_data:
            growth_rate = data_point.market_cap / prev_year_data.market_cap
            if growth_rate > 10 or growth_rate < 0.1:
                return False
                
        if next_year_data:
            growth_rate = next_year_data.market_cap / data_point.market_cap
            if growth_rate > 10 or growth_rate < 0.1:
                return False
        
        return True
    
    def _validate_minimum_value(self, data_point: MarketCapData, all_data: List[MarketCapData]) -> bool:
        """Check if market cap is above minimum reasonable value"""
        # Market cap should be at least $10 million for public companies
        return data_point.market_cap >= 0.01
    
    def _validate_historical_context(self, data_point: MarketCapData, all_data: List[MarketCapData]) -> bool:
        """Validate against known historical events"""
        # This could be expanded with specific historical context checks
        # For now, just basic sanity checks
        
        # No company should have >$10T market cap in historical data
        if data_point.market_cap > 10000:
            return False
            
        return True


class MarketCapCollector:
    """Main class for collecting market cap data"""
    
    def __init__(self, alpha_vantage_key: str = None):
        self.rate_limiter = APIRateLimiter()
        self.validator = DataValidator()
        
        # Initialize APIs
        self.apis = {}
        if alpha_vantage_key:
            self.apis['alpha_vantage'] = AlphaVantageAPI(alpha_vantage_key)
        self.apis['yahoo_finance'] = YahooFinanceAPI()
        self.apis['sec_edgar'] = SECEdgarAPI()
        
        # Setup logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('market_cap_collection.log'),
                logging.StreamHandler()
            ]
        )
    
    def collect_company_data(self, ticker: str, missing_years: List[int], 
                           cik: str = None) -> List[MarketCapData]:
        """Collect market cap data for missing years of a company"""
        collected_data = []
        
        for year in missing_years:
            logging.info(f"Collecting data for {ticker} - {year}")
            
            # Try APIs in order of preference for different time periods
            if year >= 2000:
                # Modern data - try Yahoo Finance first, then Alpha Vantage
                data = self._try_api('yahoo_finance', ticker, year)
                if not data and 'alpha_vantage' in self.apis:
                    data = self._try_api('alpha_vantage', ticker, year)
            elif year >= 1994:
                # SEC electronic filing era
                data = self._try_api('sec_edgar', ticker, year, cik)
                if not data:
                    data = self._try_api('yahoo_finance', ticker, year)
            else:
                # Historical data - requires manual research
                logging.info(f"Year {year} requires manual historical research")
                continue
            
            if data:
                collected_data.append(data)
                logging.info(f"Successfully collected {ticker} {year}: ${data.market_cap}B")
            else:
                logging.warning(f"Could not find data for {ticker} {year}")
        
        # Validate collected data
        validation_results = self.validator.validate_data(collected_data)
        
        # Log validation issues
        for data_point, issues in validation_results:
            if issues:
                logging.warning(f"Validation issues for {ticker} {data_point.year}: {issues}")
        
        return collected_data
    
    def _try_api(self, api_name: str, ticker: str, year: int, cik: str = None) -> Optional[MarketCapData]:
        """Try to get data from a specific API with rate limiting"""
        if api_name not in self.apis:
            return None
        
        # Check rate limits
        self.rate_limiter.wait_if_needed(api_name)
        
        try:
            api = self.apis[api_name]
            
            if api_name == 'sec_edgar' and cik:
                data = api.get_market_cap_data(cik, ticker, year)
            else:
                data = api.get_market_cap_data(ticker, year)
            
            # Record the API call
            self.rate_limiter.record_call(api_name)
            
            return data
            
        except Exception as e:
            logging.error(f"Error calling {api_name} for {ticker} {year}: {e}")
            return None


# Company-specific configurations
COMPANY_CONFIGS = {
    'META': {
        'ticker': 'META',
        'cik': '0001326801',
        'missing_years': [2013, 2014],
        'priority': 'LOW'
    },
    'GOOGL': {
        'ticker': 'GOOGL', 
        'cik': '0001652044',
        'missing_years': [2006, 2007, 2008, 2009, 2011, 2012, 2013, 2014],
        'priority': 'LOW'
    },
    'TSLA': {
        'ticker': 'TSLA',
        'cik': '0001318605',
        'missing_years': [2011, 2012, 2013, 2014, 2016, 2017, 2018, 2019, 2022],
        'priority': 'LOW'
    },
    'NVDA': {
        'ticker': 'NVDA',
        'cik': '0001045810',
        'missing_years': [2001, 2002, 2003, 2004, 2006, 2007, 2008, 2009, 2011, 2012, 2013, 2014, 2016, 2017, 2018, 2019, 2022],
        'priority': 'MEDIUM'
    },
    'AMZN': {
        'ticker': 'AMZN',
        'cik': '0001018724',
        'missing_years': [1998, 1999, 2001, 2003, 2004, 2006, 2007, 2008, 2009, 2011, 2012, 2013, 2014],
        'priority': 'LOW'
    }
}


def main():
    """Main execution function"""
    # Initialize collector (you'll need to provide Alpha Vantage API key)
    collector = MarketCapCollector()
    
    # Start with LOW priority companies for quick wins
    low_priority_companies = [k for k, v in COMPANY_CONFIGS.items() if v['priority'] == 'LOW']
    
    for company in low_priority_companies:
        config = COMPANY_CONFIGS[company]
        logging.info(f"Starting data collection for {company}")
        
        collected_data = collector.collect_company_data(
            ticker=config['ticker'],
            missing_years=config['missing_years'],
            cik=config['cik']
        )
        
        logging.info(f"Collected {len(collected_data)} data points for {company}")
        
        # Save results (implementation needed)
        # save_to_json(company, collected_data)


if __name__ == "__main__":
    main()