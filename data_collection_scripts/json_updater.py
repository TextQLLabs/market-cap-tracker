#!/usr/bin/env python3
"""
JSON Data Pipeline
Updates the market cap JSON file with new collected data
"""

import json
import logging
import shutil
from datetime import datetime
from typing import Dict, List, Any
from pathlib import Path
from market_cap_collector import MarketCapData


class MarketCapJSONUpdater:
    """Handles updating the market cap JSON file with new data"""
    
    def __init__(self, json_file_path: str):
        self.json_file_path = Path(json_file_path)
        self.backup_dir = Path("backups")
        self.backup_dir.mkdir(exist_ok=True)
        
        # Setup logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
    
    def load_current_data(self) -> Dict[str, Any]:
        """Load the current JSON data"""
        try:
            with open(self.json_file_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            logging.error(f"JSON file not found: {self.json_file_path}")
            raise
        except json.JSONDecodeError as e:
            logging.error(f"Invalid JSON format: {e}")
            raise
    
    def create_backup(self) -> str:
        """Create a backup of the current JSON file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"market_caps_backup_{timestamp}.json"
        backup_path = self.backup_dir / backup_filename
        
        shutil.copy2(self.json_file_path, backup_path)
        logging.info(f"Created backup: {backup_path}")
        
        return str(backup_path)
    
    def update_company_data(self, ticker: str, new_data_points: List[MarketCapData]) -> bool:
        """Update market cap data for a specific company"""
        try:
            # Create backup first
            self.create_backup()
            
            # Load current data
            data = self.load_current_data()
            
            if ticker not in data['companies']:
                logging.error(f"Company {ticker} not found in JSON data")
                return False
            
            company_data = data['companies'][ticker]
            market_cap_history = company_data['market_cap_history']
            
            # Track changes
            updates_made = 0
            replacements_made = 0
            new_entries_added = 0
            
            for new_data_point in new_data_points:
                year = new_data_point.year
                
                # Find existing entry for this year
                existing_entry_index = None
                for i, entry in enumerate(market_cap_history):
                    if entry['year'] == year:
                        existing_entry_index = i
                        break
                
                # Create new entry
                new_entry = {
                    "year": new_data_point.year,
                    "market_cap": new_data_point.market_cap,
                    "citation": new_data_point.citation,
                    "notes": new_data_point.notes
                }
                
                if existing_entry_index is not None:
                    # Replace existing entry
                    old_entry = market_cap_history[existing_entry_index]
                    old_citation = old_entry.get('citation', '')
                    
                    # Only replace if new data is better quality
                    if self._should_replace_entry(old_citation, new_data_point.citation, new_data_point.confidence_level):
                        market_cap_history[existing_entry_index] = new_entry
                        replacements_made += 1
                        logging.info(f"Replaced {ticker} {year}: ${old_entry['market_cap']}B -> ${new_data_point.market_cap}B")
                    else:
                        logging.info(f"Kept existing {ticker} {year} data (better quality)")
                else:
                    # Add new entry
                    market_cap_history.append(new_entry)
                    new_entries_added += 1
                    logging.info(f"Added new {ticker} {year}: ${new_data_point.market_cap}B")
                
                updates_made += 1
            
            # Sort entries by year
            market_cap_history.sort(key=lambda x: x['year'])
            
            # Update metadata
            data['metadata']['last_updated'] = datetime.now().strftime("%Y-%m-%d")
            
            # Save updated data
            with open(self.json_file_path, 'w') as f:
                json.dump(data, f, indent=2)
            
            logging.info(f"Successfully updated {ticker}: {new_entries_added} new, {replacements_made} replaced")
            return True
            
        except Exception as e:
            logging.error(f"Error updating {ticker} data: {e}")
            return False
    
    def _should_replace_entry(self, old_citation: str, new_citation: str, confidence_level: str) -> bool:
        """Determine if a new entry should replace an existing one"""
        
        # Priority order: SEC filings > APIs > INTERPOLATED > Manual estimates
        source_priority = {
            'SEC': 5,
            'API': 4, 
            'Historical records': 3,
            'User provided data': 2,
            'INTERPOLATED': 1,
            'DATA_INCOMPLETE': 0
        }
        
        def get_source_priority(citation: str) -> int:
            for source, priority in source_priority.items():
                if source in citation:
                    return priority
            return 1  # Default to low priority
        
        old_priority = get_source_priority(old_citation)
        new_priority = get_source_priority(new_citation)
        
        # Replace if new source is higher priority
        if new_priority > old_priority:
            return True
        
        # Replace INTERPOLATED data with any real data
        if 'INTERPOLATED' in old_citation and 'INTERPOLATED' not in new_citation:
            return True
        
        # Replace DATA_INCOMPLETE with any data
        if 'DATA_INCOMPLETE' in old_citation:
            return True
        
        return False
    
    def get_completion_stats(self) -> Dict[str, Any]:
        """Calculate completion statistics for the dataset"""
        data = self.load_current_data()
        stats = {
            'companies': {},
            'overall': {
                'total_expected': 0,
                'total_actual': 0,
                'total_missing': 0,
                'interpolated_count': 0,
                'incomplete_count': 0
            }
        }
        
        for ticker, company_data in data['companies'].items():
            first_year = company_data['first_public_year']
            current_year = 2025
            expected_years = current_year - first_year + 1
            
            market_cap_history = company_data['market_cap_history']
            actual_count = len([entry for entry in market_cap_history if isinstance(entry['market_cap'], (int, float))])
            interpolated_count = len([entry for entry in market_cap_history if 'INTERPOLATED' in str(entry.get('citation', ''))])
            incomplete_count = len([entry for entry in market_cap_history if 'DATA_INCOMPLETE' in str(entry.get('market_cap', ''))])
            
            missing_count = expected_years - len(market_cap_history)
            completion_rate = (actual_count / expected_years) * 100 if expected_years > 0 else 0
            
            stats['companies'][ticker] = {
                'expected_years': expected_years,
                'actual_count': actual_count,
                'missing_count': missing_count,
                'interpolated_count': interpolated_count,
                'incomplete_count': incomplete_count,
                'completion_rate': round(completion_rate, 1)
            }
            
            # Update overall stats
            stats['overall']['total_expected'] += expected_years
            stats['overall']['total_actual'] += actual_count
            stats['overall']['total_missing'] += missing_count
            stats['overall']['interpolated_count'] += interpolated_count
            stats['overall']['incomplete_count'] += incomplete_count
        
        # Calculate overall completion rate
        total_expected = stats['overall']['total_expected']
        total_actual = stats['overall']['total_actual']
        stats['overall']['completion_rate'] = round((total_actual / total_expected) * 100, 1) if total_expected > 0 else 0
        
        return stats
    
    def generate_progress_report(self) -> str:
        """Generate a progress report"""
        stats = self.get_completion_stats()
        
        report = []
        report.append("MARKET CAP DATA COLLECTION PROGRESS REPORT")
        report.append("=" * 50)
        report.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("")
        
        # Overall statistics
        overall = stats['overall']
        report.append("OVERALL STATISTICS:")
        report.append(f"  Total Expected Data Points: {overall['total_expected']}")
        report.append(f"  Total Actual Data Points: {overall['total_actual']}")
        report.append(f"  Total Missing: {overall['total_missing']}")
        report.append(f"  Overall Completion Rate: {overall['completion_rate']}%")
        report.append(f"  Interpolated Entries: {overall['interpolated_count']}")
        report.append(f"  Incomplete Entries: {overall['incomplete_count']}")
        report.append("")
        
        # Company-by-company breakdown
        report.append("COMPANY BREAKDOWN:")
        report.append(f"{'Company':<6} {'Expected':<8} {'Actual':<6} {'Missing':<7} {'Interp':<6} {'Incomp':<6} {'Rate':<6}")
        report.append("-" * 50)
        
        # Sort companies by completion rate (lowest first)
        company_stats = [(ticker, data) for ticker, data in stats['companies'].items()]
        company_stats.sort(key=lambda x: x[1]['completion_rate'])
        
        for ticker, company_data in company_stats:
            report.append(f"{ticker:<6} {company_data['expected_years']:<8} {company_data['actual_count']:<6} "
                         f"{company_data['missing_count']:<7} {company_data['interpolated_count']:<6} "
                         f"{company_data['incomplete_count']:<6} {company_data['completion_rate']:<6}%")
        
        return "\n".join(report)
    
    def validate_json_structure(self) -> List[str]:
        """Validate the JSON structure for consistency"""
        issues = []
        
        try:
            data = self.load_current_data()
            
            # Check required top-level keys
            required_keys = ['metadata', 'companies']
            for key in required_keys:
                if key not in data:
                    issues.append(f"Missing required top-level key: {key}")
            
            # Check each company
            for ticker, company_data in data.get('companies', {}).items():
                # Check required company keys
                required_company_keys = ['name', 'ticker', 'first_public_year', 'ever_top_10', 'market_cap_history']
                for key in required_company_keys:
                    if key not in company_data:
                        issues.append(f"{ticker}: Missing required key '{key}'")
                
                # Check market cap history entries
                for i, entry in enumerate(company_data.get('market_cap_history', [])):
                    required_entry_keys = ['year', 'market_cap', 'citation', 'notes']
                    for key in required_entry_keys:
                        if key not in entry:
                            issues.append(f"{ticker} entry {i}: Missing required key '{key}'")
                    
                    # Validate data types
                    if 'year' in entry and not isinstance(entry['year'], int):
                        issues.append(f"{ticker} entry {i}: 'year' should be integer")
                    
                    if 'market_cap' in entry:
                        mc = entry['market_cap']
                        if mc != "PRIVATE" and mc != "DATA_INCOMPLETE" and not isinstance(mc, (int, float)):
                            issues.append(f"{ticker} entry {i}: 'market_cap' should be number, 'PRIVATE', or 'DATA_INCOMPLETE'")
        
        except Exception as e:
            issues.append(f"Error validating JSON structure: {e}")
        
        return issues


def update_with_collected_data():
    """Example function showing how to update the JSON with collected data"""
    
    # Example usage
    updater = MarketCapJSONUpdater('/Users/ethanding/projects/top-market-caps-tracker/market_caps_data_updated.json')
    
    # Example: Update META with new data points
    meta_data = [
        MarketCapData(
            year=2013,
            market_cap=104.0,
            citation="SEC 10-K Filing + Alpha Vantage API",
            notes="Cross-verified with 2013 annual report",
            confidence_level="HIGH",
            last_verified="2025-01-21",
            source_type="API"
        ),
        MarketCapData(
            year=2014,
            market_cap=215.0,
            citation="SEC 10-K Filing + Yahoo Finance API", 
            notes="Year-end market cap calculation",
            confidence_level="HIGH",
            last_verified="2025-01-21",
            source_type="API"
        )
    ]
    
    # Update the JSON
    success = updater.update_company_data('META', meta_data)
    
    if success:
        # Generate progress report
        report = updater.generate_progress_report()
        print(report)
        
        # Save report to file
        with open('progress_report.txt', 'w') as f:
            f.write(report)
    
    # Validate JSON structure
    issues = updater.validate_json_structure()
    if issues:
        print("JSON Validation Issues:")
        for issue in issues:
            print(f"  - {issue}")
    else:
        print("JSON structure validation passed!")


if __name__ == "__main__":
    update_with_collected_data()