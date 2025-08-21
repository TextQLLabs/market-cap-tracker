# Market Cap API

A real-time market capitalization tracking API that aggregates data from multiple free financial data sources, similar to companiesmarketcap.com.

## Features

- **Real-time Market Data**: Collects current stock prices and market caps from multiple free APIs
- **Historical Tracking**: Stores historical market cap data for trend analysis
- **Automated Collection**: Scheduled data collection every 15 minutes during market hours
- **Multiple Data Sources**: Fallback system using Yahoo Finance, Alpha Vantage, FMP, and SEC EDGAR
- **RESTful API**: Clean endpoints for accessing market cap rankings and company data
- **Rate Limiting**: Built-in protection against API abuse
- **Railway Deployment Ready**: Configured for easy cloud deployment

## Data Sources

### Primary (Free)
- **Yahoo Finance**: Main source for real-time prices (unofficial but reliable)
- **SEC EDGAR API**: Official government data for fundamental information
- **Alpha Vantage**: 25 calls/day free tier for backup data
- **Financial Modeling Prep (FMP)**: 250 calls/day free tier

### Data Collection Strategy
- **Price Updates**: Every 15 minutes during market hours (9 AM - 4 PM EST)
- **Fundamental Data**: Daily collection of shares outstanding from SEC filings
- **Fallback System**: If one API fails, automatically tries the next source
- **Rate Limiting**: Respects all API rate limits with intelligent delays

## Installation

1. **Clone and Setup**:
```bash
cd market-cap-api
npm install
```

2. **Environment Configuration**:
```bash
cp .env.example .env
```

Edit `.env` with your API keys:
```bash
# Free API Keys (all optional, system works with fallbacks)
ALPHA_VANTAGE_API_KEY=your_key_here  # Get free at alphavantage.co
FMP_API_KEY=your_key_here           # Get free at financialmodelingprep.com

# Database
DATABASE_PATH=./data/market_caps.db

# Server
PORT=3001
NODE_ENV=development
```

3. **Initialize Database**:
```bash
npm run collect  # This will create the database and collect initial data
```

## Usage

### Development
```bash
npm run dev        # Start with auto-reload
npm run collect    # Manual data collection
```

### Production
```bash
npm start          # Production server
```

## API Endpoints

### Get Current Top Companies
```http
GET /api/top-companies?limit=50
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "ticker": "AAPL",
      "name": "Apple Inc.",
      "market_cap": 3000.5,
      "price": 185.42,
      "change_percent": 1.23,
      "sector": "Technology",
      "exchange": "NASDAQ",
      "last_updated": "2025-01-21T15:30:00Z"
    }
  ],
  "meta": {
    "total": 50,
    "lastUpdated": "2025-01-21T15:30:00Z"
  }
}
```

### Get Company Details
```http
GET /api/company/AAPL?days=30
```

### Get Historical Rankings
```http
GET /api/rankings/2025-01-21?limit=10
```

### Get System Stats
```http
GET /api/stats
```

### Health Check
```http
GET /health
```

## Database Schema

### Companies Table
- Basic company information (ticker, name, sector, etc.)
- Shares outstanding from SEC filings
- IPO dates and metadata

### Market Cap History
- Daily price and market cap snapshots
- Source attribution for each data point
- Volume and change percentage tracking

### Current Rankings
- Optimized table for fast ranking queries
- Updated after each price collection
- Top 100 companies by market cap

### Collection Log
- Tracks all data collection attempts
- Success/failure rates and error logging
- Performance metrics

## Data Quality

### Update Frequency
- **Market Hours**: Every 15 minutes (9 AM - 4 PM EST, Mon-Fri)
- **After Hours**: Every hour
- **Weekends**: Every 6 hours (for international markets)

### Data Accuracy
- **Real-time prices**: 15-minute delay (similar to companiesmarketcap.com)
- **Market caps**: Calculated as Price × Shares Outstanding
- **Shares outstanding**: Updated daily from SEC filings
- **Multiple source validation**: Cross-checks between APIs

### Error Handling
- Automatic fallback between data sources
- Graceful handling of API failures
- Comprehensive logging and monitoring
- Data integrity checks

## Railway Deployment

### Automatic Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway deploy
```

### Environment Variables (Railway)
Set these in your Railway dashboard:
```bash
ALPHA_VANTAGE_API_KEY=your_key
FMP_API_KEY=your_key  
NODE_ENV=production
DATABASE_PATH=/app/data/market_caps.db
```

### Railway Configuration
The app includes a `railway.toml` file with optimized settings:
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Health Check**: `/health`
- **Auto-scaling**: Enabled

## Cost Analysis

### Free Tier Usage
- **Yahoo Finance**: Unlimited (unofficial)
- **SEC EDGAR**: Unlimited (official government API)
- **Alpha Vantage**: 25 calls/day (covers 25 companies)
- **FMP**: 250 calls/day (covers major companies)

### Scaling Costs
- **Alpha Vantage Pro**: $29.99/month (500 calls/day)
- **FMP Premium**: $19.99/month (unlimited calls)
- **Railway Hosting**: $5-20/month depending on usage

### Total Cost Estimate
- **Free tier**: $0/month (covers top 50-100 companies)
- **Premium tier**: $50-100/month (covers all US stocks)

## Monitoring

### Built-in Logging
- Request/response logging with Winston
- Performance metrics tracking
- Data collection success rates
- Error tracking and alerting

### Health Monitoring
- `/health` endpoint for uptime monitoring
- Database connectivity checks
- API source availability tracking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues or questions:
1. Check the logs in `logs/` directory
2. Verify API keys are valid
3. Test individual endpoints with curl/Postman
4. Check Railway deployment logs if using cloud hosting