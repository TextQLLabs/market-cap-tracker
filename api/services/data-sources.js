const axios = require('axios');
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/data-sources.log' })
  ]
});

class DataSources {
  constructor() {
    this.alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.iexToken = process.env.IEX_CLOUD_TOKEN;
    this.fmpKey = process.env.FMP_API_KEY;
    
    // Rate limiting
    this.lastAlphaVantageCall = 0;
    this.alphaVantageDelay = 12000; // 12 seconds between calls (5 calls/minute)
  }

  // Alpha Vantage - Free tier: 25 calls/day, 5 calls/minute
  async getAlphaVantageQuote(symbol) {
    try {
      const now = Date.now();
      const timeSinceLastCall = now - this.lastAlphaVantageCall;
      
      if (timeSinceLastCall < this.alphaVantageDelay) {
        await new Promise(resolve => setTimeout(resolve, this.alphaVantageDelay - timeSinceLastCall));
      }
      
      const response = await axios.get(`https://www.alphavantage.co/query`, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: this.alphaVantageKey
        },
        timeout: 10000
      });
      
      this.lastAlphaVantageCall = Date.now();
      
      const quote = response.data['Global Quote'];
      if (!quote || Object.keys(quote).length === 0) {
        throw new Error('No quote data returned');
      }
      
      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        source: 'alphavantage'
      };
    } catch (error) {
      logger.error(`Alpha Vantage error for ${symbol}:`, error.message);
      return null;
    }
  }

  // Yahoo Finance (unofficial but free)
  async getYahooQuote(symbol) {
    try {
      const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const result = response.data.chart.result[0];
      const meta = result.meta;
      const quote = result.indicators.quote[0];
      
      return {
        symbol: meta.symbol,
        price: meta.regularMarketPrice,
        change: meta.regularMarketPrice - meta.previousClose,
        changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
        volume: meta.regularMarketVolume,
        marketCap: meta.regularMarketPrice * result.meta.sharesOutstanding,
        sharesOutstanding: result.meta.sharesOutstanding,
        source: 'yahoo'
      };
    } catch (error) {
      logger.error(`Yahoo Finance error for ${symbol}:`, error.message);
      return null;
    }
  }

  // FMP (Financial Modeling Prep) - Free tier: 250 calls/day
  async getFMPQuote(symbol) {
    try {
      const response = await axios.get(`https://financialmodelingprep.com/api/v3/quote/${symbol}`, {
        params: { apikey: this.fmpKey },
        timeout: 10000
      });
      
      const quote = response.data[0];
      if (!quote) return null;
      
      return {
        symbol: quote.symbol,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changesPercentage,
        volume: quote.volume,
        marketCap: quote.marketCap,
        sharesOutstanding: quote.sharesOutstanding,
        source: 'fmp'
      };
    } catch (error) {
      logger.error(`FMP error for ${symbol}:`, error.message);
      return null;
    }
  }

  // SEC EDGAR for fundamental data (free, no rate limits)
  async getSECData(ticker) {
    try {
      // Get company CIK first
      const companyResponse = await axios.get('https://www.sec.gov/files/company_tickers.json', {
        headers: {
          'User-Agent': 'MarketCapTracker research@example.com'
        }
      });
      
      const companies = Object.values(companyResponse.data);
      const company = companies.find(c => c.ticker === ticker.toUpperCase());
      
      if (!company) return null;
      
      const cik = company.cik_str.toString().padStart(10, '0');
      
      // Get latest facts
      const factsResponse = await axios.get(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, {
        headers: {
          'User-Agent': 'MarketCapTracker research@example.com'
        }
      });
      
      const facts = factsResponse.data.facts;
      let sharesOutstanding = null;
      
      // Try to find shares outstanding from various XBRL tags
      const sharesTags = [
        'us-gaap:CommonStockSharesOutstanding',
        'us-gaap:WeightedAverageNumberOfSharesOutstandingBasic',
        'us-gaap:CommonStockSharesIssued'
      ];
      
      for (const tag of sharesTags) {
        if (facts['us-gaap'] && facts['us-gaap'][tag.replace('us-gaap:', '')]) {
          const shareData = facts['us-gaap'][tag.replace('us-gaap:', '')].units.shares;
          if (shareData && shareData.length > 0) {
            // Get most recent data
            const latest = shareData.sort((a, b) => new Date(b.end) - new Date(a.end))[0];
            sharesOutstanding = latest.val;
            break;
          }
        }
      }
      
      return {
        cik: cik,
        ticker: ticker,
        name: company.title,
        sharesOutstanding: sharesOutstanding,
        source: 'sec'
      };
    } catch (error) {
      logger.error(`SEC EDGAR error for ${ticker}:`, error.message);
      return null;
    }
  }

  // Get quote with fallback sources
  async getQuoteWithFallback(symbol) {
    const sources = [
      () => this.getYahooQuote(symbol),
      () => this.getFMPQuote(symbol),
      () => this.getAlphaVantageQuote(symbol)
    ];
    
    for (const source of sources) {
      try {
        const quote = await source();
        if (quote && quote.price > 0) {
          logger.info(`Successfully got quote for ${symbol} from ${quote.source}`);
          return quote;
        }
      } catch (error) {
        logger.warn(`Failed to get quote for ${symbol} from source:`, error.message);
        continue;
      }
    }
    
    logger.error(`Failed to get quote for ${symbol} from all sources`);
    return null;
  }

  // Batch quotes (respecting rate limits)
  async getBatchQuotes(symbols, batchSize = 5) {
    const results = [];
    
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const promises = batch.map(symbol => this.getQuoteWithFallback(symbol));
      
      const batchResults = await Promise.allSettled(promises);
      results.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : null));
      
      // Rate limiting delay between batches
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results.filter(r => r !== null);
  }
}

module.exports = DataSources;