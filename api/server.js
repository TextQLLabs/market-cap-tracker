const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cron = require('node-cron');
const Database = require('./config/database');
const DataCollector = require('./scripts/data-collector');
const winston = require('winston');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/server.log' })
  ]
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001']
}));
app.use(express.json());

// Rate limiting middleware
const rateLimit = {};
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = parseInt(process.env.MAX_REQUESTS_PER_MINUTE) || 100;

app.use((req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!rateLimit[clientIP]) {
    rateLimit[clientIP] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
  } else if (now > rateLimit[clientIP].resetTime) {
    rateLimit[clientIP] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
  } else {
    rateLimit[clientIP].count++;
  }
  
  if (rateLimit[clientIP].count > MAX_REQUESTS) {
    return res.status(429).json({ 
      error: 'Too many requests', 
      retryAfter: Math.ceil((rateLimit[clientIP].resetTime - now) / 1000) 
    });
  }
  
  next();
});

// Initialize database and collector
const db = new Database();
const collector = new DataCollector();

// API Routes

// Get current top companies
app.get('/api/top-companies', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const companies = await collector.getTopCompanies(limit);
    
    res.json({
      success: true,
      data: companies,
      meta: {
        total: companies.length,
        lastUpdated: companies[0]?.last_updated,
        source: 'multiple'
      }
    });
  } catch (error) {
    logger.error('Error getting top companies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific company data
app.get('/api/company/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const days = Math.min(parseInt(req.query.days) || 30, 365);
    
    // Get company info
    const company = await db.get(`
      SELECT c.*, r.rank, r.market_cap as current_market_cap, r.price as current_price
      FROM companies c
      LEFT JOIN current_rankings r ON c.ticker = r.ticker
      WHERE c.ticker = ?
    `, [ticker.toUpperCase()]);
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // Get historical data
    const historical = await collector.getHistoricalData(ticker.toUpperCase(), days);
    
    res.json({
      success: true,
      data: {
        company,
        historical,
        meta: {
          ticker: ticker.toUpperCase(),
          dataPoints: historical.length,
          daysCovered: days
        }
      }
    });
  } catch (error) {
    logger.error(`Error getting company data for ${req.params.ticker}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get market cap rankings for specific date
app.get('/api/rankings/:date?', async (req, res) => {
  try {
    const date = req.params.date || new Date().toISOString().split('T')[0];
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    
    const rankings = await db.all(`
      SELECT 
        ROW_NUMBER() OVER (ORDER BY h.market_cap DESC) as rank,
        h.ticker,
        c.name,
        h.market_cap,
        h.price,
        h.change_percent,
        h.source,
        c.sector
      FROM market_cap_history h
      JOIN companies c ON h.ticker = c.ticker
      WHERE h.date = ?
      AND h.market_cap > 0
      ORDER BY h.market_cap DESC
      LIMIT ?
    `, [date, limit]);
    
    res.json({
      success: true,
      data: rankings,
      meta: {
        date,
        total: rankings.length
      }
    });
  } catch (error) {
    logger.error(`Error getting rankings for ${req.params.date}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get collection statistics
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.all(`
      SELECT 
        COUNT(DISTINCT ticker) as total_companies,
        COUNT(*) as total_data_points,
        MAX(date) as latest_date,
        MIN(date) as earliest_date,
        COUNT(DISTINCT source) as data_sources
      FROM market_cap_history
    `);
    
    const recentCollection = await db.get(`
      SELECT * FROM collection_log
      ORDER BY created_at DESC
      LIMIT 1
    `);
    
    const topMarketCap = await db.get(`
      SELECT SUM(market_cap) as total_market_cap
      FROM current_rankings
      WHERE rank <= 10
    `);
    
    res.json({
      success: true,
      data: {
        database: stats[0],
        lastCollection: recentCollection,
        topTenTotal: topMarketCap?.total_market_cap || 0
      }
    });
  } catch (error) {
    logger.error('Error getting stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manual data collection trigger (for testing)
app.post('/api/collect', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Manual collection disabled in production' });
  }
  
  try {
    logger.info('Manual collection triggered');
    const results = await collector.collectCurrentPrices();
    
    res.json({
      success: true,
      message: 'Collection completed',
      data: results
    });
  } catch (error) {
    logger.error('Manual collection error:', error);
    res.status(500).json({ error: 'Collection failed' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Scheduled data collection
if (process.env.NODE_ENV !== 'test') {
  // Collect prices and market caps daily at 6 PM EST (after markets close)
  cron.schedule('0 18 * * 1-5', async () => {
    logger.info('Daily market cap collection starting...');
    try {
      await collector.collectCurrentPrices();
      logger.info('Daily price collection completed successfully');
    } catch (error) {
      logger.error('Daily collection error:', error);
    }
  }, {
    timezone: "America/New_York"
  });

  // Collect fundamental data (shares outstanding) weekly on Sunday at 6 AM
  cron.schedule('0 6 * * 0', async () => {
    logger.info('Weekly fundamental data collection starting...');
    try {
      await collector.collectFundamentalData();
      logger.info('Weekly fundamental data collection completed successfully');
    } catch (error) {
      logger.error('Fundamental collection error:', error);
    }
  }, {
    timezone: "America/New_York"
  });

  // Initialize companies on startup
  collector.initializeCompanies().then(() => {
    logger.info('Companies initialized');
  }).catch(error => {
    logger.error('Initialization error:', error);
  });
}

// Start server
app.listen(PORT, () => {
  logger.info(`Market Cap API server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;