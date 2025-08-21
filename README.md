# Market Cap Tracker

A comprehensive full-stack application for tracking and visualizing market capitalizations of top companies throughout history. Features real-time data collection, historical analysis, and interactive visualizations.

## Features

### 📊 **Frontend (Next.js)**
- **Interactive Table**: Sortable, filterable market cap data with search
- **Historical Analysis**: Year-by-year top 10 evolution charts
- **Top 10 Highlighting**: Current year's top 10 companies clearly marked
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Connects to live API for current data

### 🔌 **Backend API (Express.js)**
- **Real-time Data Collection**: Automated collection every 15 minutes during market hours
- **Multiple Data Sources**: Yahoo Finance, SEC EDGAR, Alpha Vantage, FMP
- **Historical Storage**: SQLite database with comprehensive market cap history
- **RESTful API**: Clean endpoints for accessing all market cap data
- **Rate Limiting**: Built-in protection and intelligent fallback systems

### 📈 **Data Coverage**
- **16+ Companies**: All companies that have ever been in the top 10
- **45+ Years**: Historical data from 1980-2025
- **Real Citations**: Proper source attribution for all data points
- **Quality Indicators**: Clear marking of real vs. estimated data

## Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Set up environment variables
cp api/.env.example api/.env
# Edit api/.env with your API keys (optional - works with free sources)

# Start both frontend and API
npm run dev

# Or start individually
npm run dev:next  # Next.js on :3000
npm run dev:api   # API on :3001
```

### Production Deployment (Railway)
```bash
# Build and start production servers
npm run build
npm start
```

## API Endpoints

Base URL: `http://localhost:3001/api` (development) or `https://your-railway-url.com/api` (production)

### Current Market Data
```http
GET /api/top-companies?limit=50
```
Returns current market cap rankings for top companies.

### Company Details
```http
GET /api/company/AAPL?days=30
```
Returns detailed information and historical data for a specific company.

### Historical Rankings
```http
GET /api/rankings/2025-01-21?limit=10
```
Returns top 10 companies for any specific date.

### System Statistics
```http
GET /api/stats
```
Returns database statistics and collection status.

### Health Check
```http
GET /health
```
API health status and uptime information.

## Data Sources

### Free APIs Used
1. **Yahoo Finance** - Primary real-time price data (unlimited)
2. **SEC EDGAR** - Official shares outstanding data (unlimited)
3. **Alpha Vantage** - Backup price data (25 calls/day free)
4. **Financial Modeling Prep** - Additional market data (250 calls/day free)

### Data Collection Schedule
- **Market Hours**: Every 15 minutes (9 AM - 4 PM EST, Mon-Fri)
- **After Hours**: Every hour
- **Fundamental Data**: Daily at 6 AM (shares outstanding from SEC)
- **Weekend**: Every 6 hours for international markets

## Project Structure

```
market-cap-tracker/
├── api/                        # Express.js API server
│   ├── config/database.js      # SQLite database setup
│   ├── services/data-sources.js # API integrations
│   ├── scripts/data-collector.js # Automated data collection
│   ├── server.js               # Main API server
│   └── package.json            # API dependencies
├── components/                 # React components
│   ├── ui/                     # shadcn/ui components
│   ├── market-cap-table.tsx    # Main data table
│   └── top10-evolution.tsx     # Historical charts
├── lib/                        # Utility functions
│   └── market-cap-data.ts      # Data processing utilities
├── src/app/                    # Next.js app directory
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # App layout
│   └── page.tsx                # Main page
├── data/                       # Static data files
├── package.json                # Main project config
├── railway.toml                # Railway deployment config
└── start.js                    # Production startup script
```

## Environment Variables

### Required for Full Functionality
```bash
# Optional API Keys (free tiers available)
ALPHA_VANTAGE_API_KEY=your_key_here
FMP_API_KEY=your_key_here

# Database
DATABASE_PATH=./data/market_caps.db

# Server Configuration
PORT=3000
API_PORT=3001
NODE_ENV=production

# Data Collection
PRICE_UPDATE_INTERVAL=15
MAX_REQUESTS_PER_MINUTE=100
```

### Getting API Keys (Free)
- **Alpha Vantage**: https://www.alphavantage.co/support/#api-key
- **FMP**: https://financialmodelingprep.com/developer/docs

*Note: The system works without API keys using Yahoo Finance and SEC EDGAR*

## Railway Deployment

### Automatic Deployment
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on every push

### Manual Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway deploy
```

### Environment Variables for Railway
Set these in your Railway project dashboard:
```bash
NODE_ENV=production
DATABASE_PATH=/app/data/market_caps.db
ALPHA_VANTAGE_API_KEY=your_key_here
FMP_API_KEY=your_key_here
```

## Development Commands

```bash
# Development
npm run dev              # Start both frontend and API
npm run dev:next         # Start only Next.js frontend
npm run dev:api          # Start only Express API

# Production
npm run build            # Build both applications
npm start                # Start production servers
npm run start:next       # Start only Next.js production
npm run start:api        # Start only API production

# Data Management
npm run collect          # Manual data collection
npm run lint             # Code linting

# Deployment
npm run deploy           # Deploy to Railway
```

## Features in Detail

### Historical Data Analysis
- **Complete Coverage**: Every company that has ever been top 10
- **Data Quality Tracking**: Real data vs. estimates clearly marked
- **Source Attribution**: Every data point has proper citations
- **Gap Analysis**: Systematic identification of missing data

### Real-time Updates
- **Live Price Feeds**: Updated every 15 minutes during market hours
- **Automatic Fallbacks**: If one API fails, automatically tries others
- **Rate Limit Respect**: Intelligent delays to stay within API limits
- **Error Recovery**: Robust error handling and retry logic

### Interactive Visualizations
- **Sortable Tables**: Click any column header to sort
- **Search Functionality**: Find companies by name or ticker
- **Year Filtering**: Focus on specific time periods
- **Top 10 Highlighting**: Current leaders clearly marked

## Performance

### Database
- **SQLite**: Fast, serverless database perfect for Railway
- **Optimized Indexes**: Fast queries for rankings and time series
- **Efficient Storage**: Minimal space usage with data compression

### API Performance
- **Rate Limiting**: 100 requests/minute to prevent abuse
- **Caching**: Database caching for frequently accessed data
- **Compression**: Gzip compression for all API responses
- **Health Monitoring**: Built-in health checks and logging

## Monitoring

### Logging
- **Winston Logging**: Structured JSON logs for production
- **Collection Tracking**: Success/failure rates for data collection
- **Error Monitoring**: Comprehensive error tracking and alerting

### Health Checks
- **API Health**: `/health` endpoint for uptime monitoring
- **Database Status**: Connection and query performance tracking
- **Data Freshness**: Alerts when data becomes stale

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Issues**: Report bugs and request features via GitHub Issues
- **Documentation**: Check this README and API documentation
- **Health Check**: Visit `/health` endpoint to verify system status

---

Built with ❤️ by TextQL Labs using Next.js, Express.js, and multiple financial data APIs.