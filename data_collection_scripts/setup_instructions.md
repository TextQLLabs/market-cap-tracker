# Data Collection System Setup Instructions

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
cd /Users/ethanding/projects/top-market-caps-tracker/data_collection_scripts
pip install -r requirements.txt
```

### 2. Get Alpha Vantage API Key (Optional but Recommended)
1. Visit: https://www.alphavantage.co/support/#api-key
2. Sign up for free account (500 calls/day)
3. Set environment variable:
```bash
export ALPHA_VANTAGE_API_KEY="your_key_here"
```

### 3. Run Quick Wins Collection
```bash
python quick_wins_executor.py
```

## Detailed Setup

### Environment Variables
Create a `.env` file in the scripts directory:
```bash
# Alpha Vantage API (Free tier: 500 calls/day)
ALPHA_VANTAGE_API_KEY=your_key_here

# Optional: For premium services
BLOOMBERG_API_KEY=your_key_here
SP_CAPITAL_IQ_KEY=your_key_here
```

### Project Structure
```
data_collection_scripts/
├── market_cap_collector.py      # Main collection engine
├── json_updater.py             # JSON data pipeline
├── quick_wins_executor.py      # Phase 1 execution
├── requirements.txt            # Dependencies
├── setup_instructions.md       # This file
├── backups/                    # Auto-generated backups
└── logs/                       # Collection logs
```

## Usage Examples

### Basic Data Collection
```python
from market_cap_collector import MarketCapCollector

# Initialize collector
collector = MarketCapCollector(alpha_vantage_key="your_key")

# Collect data for specific company and years
data = collector.collect_company_data(
    ticker="TSLA",
    missing_years=[2011, 2012, 2013, 2014]
)

print(f"Collected {len(data)} data points")
```

### Update JSON File
```python
from json_updater import MarketCapJSONUpdater

# Initialize updater
updater = MarketCapJSONUpdater("../market_caps_data_updated.json")

# Update with new data
success = updater.update_company_data("TSLA", collected_data)

# Generate progress report
report = updater.generate_progress_report()
print(report)
```

### Automated Quick Wins
```python
from quick_wins_executor import QuickWinsExecutor

# Execute Phase 1 strategy
executor = QuickWinsExecutor(alpha_vantage_key="your_key")
collected_count = executor.execute_phase_1_quick_wins()

print(f"Collected {collected_count} data points in Phase 1")
```

## API Rate Limits

### Alpha Vantage (Free)
- 5 calls per minute
- 500 calls per day
- Best for: Recent data (2000-present)

### Yahoo Finance (Free)
- No official limit (be respectful)
- Best for: 1990s-present data
- More reliable for historical data

### SEC EDGAR (Free)
- 10 requests per second recommended
- Best for: Official filings (1994-present)

## Expected Results by Phase

### Phase 1: Quick Wins (Week 1)
**Target Companies**: META, GOOGL, TSLA, AMZN, NVDA, AVGO, ARAMCO
**Expected Collection**: 50-75 data points
**Success Rate**: 80-90%
**Budget**: $0

### Phase 2: Medium Priority (Week 2-4)
**Target Companies**: AAPL, MSFT, TSM
**Expected Collection**: 40-60 data points  
**Success Rate**: 70-85%
**Budget**: $0-500

### Phase 3: Historical Research (Month 2-3)
**Target Companies**: WMT, JPM, BRK.A
**Expected Collection**: 80-120 data points
**Success Rate**: 60-80%
**Budget**: $500-2000

### Phase 4: Critical Priority (Month 3-4)
**Target Companies**: GE, IBM, XOM
**Expected Collection**: 150-250 data points
**Success Rate**: 50-70%
**Budget**: $2000-5000

## Troubleshooting

### Common Issues

**"No data found for ticker"**
- Check ticker symbol (META vs FB, GOOGL vs GOOG)
- Verify company was public in target year
- Try alternative API source

**"Rate limit exceeded"**
- Wait for rate limit reset
- Check API key is valid
- Consider premium tier upgrade

**"JSON update failed"**
- Check file permissions
- Verify JSON structure
- Review backup files in backups/ directory

**"Market cap calculation seems wrong"**
- Check for stock splits in that year
- Verify shares outstanding data
- Cross-reference with multiple sources

### Data Quality Checks

The system includes automatic validation:
- Growth rate reasonableness (max 10x year-over-year)
- Minimum value checks (>$10M for public companies)
- Cross-source verification when available
- Historical context validation

### Getting Help

1. Check logs in `market_cap_collection.log`
2. Review validation reports for data quality issues
3. Use progress reports to track completion rates
4. Cross-reference suspicious data with financial news

## Advanced Configuration

### Custom Company Configuration
```python
CUSTOM_COMPANY = {
    'ticker': 'AAPL',
    'cik': '0000320193',  # SEC Central Index Key
    'missing_years': [2006, 2007, 2008, 2009],
    'priority': 'MEDIUM',
    'notes': 'iPod/iPhone revolution period'
}
```

### Historical Research Mode
For pre-1990 data, enable manual research mode:
```python
collector = MarketCapCollector(manual_research_mode=True)
# This will create research templates for manual data entry
```

### University Partnership Setup
If you have access to Bloomberg/S&P through a university:
```python
# Configure institutional data access
collector.setup_institutional_access(
    bloomberg_terminal=True,
    sp_capital_iq=True,
    university_id="your_institution"
)
```

## Success Metrics

### Completion Rate Targets
- **Week 1**: 30% overall completion
- **Month 1**: 50% overall completion  
- **Month 2**: 70% overall completion
- **Month 4**: 90% overall completion

### Quality Targets
- **>95% accuracy** for post-2000 data
- **>90% accuracy** for 1990-2000 data
- **>85% accuracy** for pre-1990 data
- **<5% INTERPOLATED** entries remaining

### Cost Efficiency
- **Phase 1**: $0 cost, 50+ data points
- **Phase 2**: <$10 per data point
- **Phase 3**: <$25 per data point
- **Phase 4**: <$40 per data point

Run the quick wins executor to start immediately with the highest probability targets!