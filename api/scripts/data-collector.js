const Database = require('../config/database');
const DataSources = require('../services/data-sources');
const winston = require('winston');
require('dotenv').config();

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/collector.log' })
  ]
});

class DataCollector {
  constructor() {
    this.db = new Database();
    this.dataSources = new DataSources();
    
    // Top companies to track (can be expanded)
    this.topCompanies = [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B',
      'AVGO', 'JPM', 'JNJ', 'V', 'PG', 'UNH', 'MA', 'HD', 'CVX', 'PFE',
      'BAC', 'ABBV', 'KO', 'PEP', 'TMO', 'COST', 'DIS', 'ABT', 'WMT',
      'CRM', 'VZ', 'ADBE', 'NFLX', 'CMCSA', 'XOM', 'NKE', 'INTC', 'AMD'
    ];
  }

  async initializeCompanies() {
    logger.info('Initializing companies database...');
    
    const companyData = [
      { ticker: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', sector: 'Technology' },
      { ticker: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', sector: 'Technology' },
      { ticker: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', sector: 'Technology' },
      { ticker: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', sector: 'Consumer Discretionary' },
      { ticker: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', sector: 'Technology' },
      { ticker: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', sector: 'Technology' },
      { ticker: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', sector: 'Consumer Discretionary' },
      { ticker: 'BRK.B', name: 'Berkshire Hathaway Inc.', exchange: 'NYSE', sector: 'Financial Services' },
      { ticker: 'AVGO', name: 'Broadcom Inc.', exchange: 'NASDAQ', sector: 'Technology' },
      { ticker: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE', sector: 'Financial Services' }
    ];

    for (const company of companyData) {
      try {
        await this.db.run(`
          INSERT OR REPLACE INTO companies (ticker, name, exchange, sector, updated_at)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [company.ticker, company.name, company.exchange, company.sector]);
        
        logger.info(`Initialized company: ${company.ticker}`);
      } catch (error) {
        logger.error(`Error initializing ${company.ticker}:`, error);
      }
    }
  }

  async collectCurrentPrices() {
    const startTime = Date.now();
    logger.info('Starting price collection...');
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    try {
      // Get quotes in batches to respect rate limits
      const quotes = await this.dataSources.getBatchQuotes(this.topCompanies, 5);
      
      for (const quote of quotes) {
        if (!quote) continue;
        
        try {
          // Calculate market cap if we have shares outstanding
          let marketCap = quote.marketCap;
          if (!marketCap && quote.sharesOutstanding) {
            marketCap = quote.price * quote.sharesOutstanding;
          }
          
          // Insert into market_cap_history
          await this.db.run(`
            INSERT OR REPLACE INTO market_cap_history 
            (ticker, date, price, market_cap, shares_outstanding, volume, change_percent, source)
            VALUES (?, DATE('now'), ?, ?, ?, ?, ?, ?)
          `, [
            quote.symbol,
            quote.price,
            marketCap,
            quote.sharesOutstanding,
            quote.volume,
            quote.changePercent,
            quote.source
          ]);
          
          successCount++;
          logger.info(`Updated ${quote.symbol}: $${quote.price} (${quote.changePercent?.toFixed(2)}%)`);
          
        } catch (error) {
          errorCount++;
          errors.push(`${quote.symbol}: ${error.message}`);
          logger.error(`Error saving ${quote.symbol}:`, error);
        }
      }
      
      // Update current rankings
      await this.updateCurrentRankings();
      
    } catch (error) {
      errorCount++;
      errors.push(`Batch collection error: ${error.message}`);
      logger.error('Batch collection error:', error);
    }

    const duration = Date.now() - startTime;
    
    // Log collection results
    await this.db.run(`
      INSERT INTO collection_log (source, status, companies_updated, errors, duration_ms)
      VALUES (?, ?, ?, ?, ?)
    `, [
      'price_collection',
      errorCount === 0 ? 'success' : 'partial_success',
      successCount,
      errors.join('; '),
      duration
    ]);
    
    logger.info(`Price collection completed: ${successCount} success, ${errorCount} errors, ${duration}ms`);
    return { successCount, errorCount, duration };
  }

  async updateCurrentRankings() {
    try {
      // Clear current rankings
      await this.db.run('DELETE FROM current_rankings');
      
      // Insert new rankings based on latest market caps
      await this.db.run(`
        INSERT INTO current_rankings (rank, ticker, market_cap, price, change_percent, last_updated)
        SELECT 
          ROW_NUMBER() OVER (ORDER BY h.market_cap DESC) as rank,
          h.ticker,
          h.market_cap,
          h.price,
          h.change_percent,
          CURRENT_TIMESTAMP
        FROM market_cap_history h
        INNER JOIN (
          SELECT ticker, MAX(date) as max_date
          FROM market_cap_history
          WHERE market_cap IS NOT NULL
          GROUP BY ticker
        ) latest ON h.ticker = latest.ticker AND h.date = latest.max_date
        WHERE h.market_cap > 0
        ORDER BY h.market_cap DESC
        LIMIT 100
      `);
      
      logger.info('Updated current rankings');
    } catch (error) {
      logger.error('Error updating rankings:', error);
      throw error;
    }
  }

  async collectFundamentalData() {
    logger.info('Collecting fundamental data from SEC...');
    
    for (const ticker of this.topCompanies.slice(0, 10)) { // Start with top 10 to respect rate limits
      try {
        const secData = await this.dataSources.getSECData(ticker);
        
        if (secData && secData.sharesOutstanding) {
          await this.db.run(`
            UPDATE companies 
            SET shares_outstanding = ?, updated_at = CURRENT_TIMESTAMP
            WHERE ticker = ?
          `, [secData.sharesOutstanding, ticker]);
          
          logger.info(`Updated shares outstanding for ${ticker}: ${secData.sharesOutstanding.toLocaleString()}`);
        }
        
        // Rate limiting for SEC API (be respectful)
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        logger.error(`Error collecting fundamental data for ${ticker}:`, error);
      }
    }
  }

  async getTopCompanies(limit = 50) {
    return await this.db.all(`
      SELECT 
        r.rank,
        r.ticker,
        c.name,
        r.market_cap,
        r.price,
        r.change_percent,
        c.sector,
        c.exchange,
        r.last_updated
      FROM current_rankings r
      JOIN companies c ON r.ticker = c.ticker
      ORDER BY r.rank
      LIMIT ?
    `, [limit]);
  }

  async getHistoricalData(ticker, days = 30) {
    return await this.db.all(`
      SELECT date, price, market_cap, volume, change_percent, source
      FROM market_cap_history
      WHERE ticker = ?
      AND date >= DATE('now', '-' || ? || ' days')
      ORDER BY date DESC
    `, [ticker, days]);
  }

  async cleanup() {
    await this.db.close();
  }
}

// CLI execution
if (require.main === module) {
  const collector = new DataCollector();
  
  async function runCollection() {
    try {
      await collector.initializeCompanies();
      await collector.collectCurrentPrices();
      
      // Collect fundamental data less frequently
      const hour = new Date().getHours();
      if (hour === 9 || hour === 15) { // 9 AM and 3 PM
        await collector.collectFundamentalData();
      }
      
      const results = await collector.getTopCompanies(10);
      console.log('\nCurrent Top 10 by Market Cap:');
      console.table(results);
      
    } catch (error) {
      logger.error('Collection error:', error);
    } finally {
      await collector.cleanup();
    }
  }
  
  runCollection();
}

module.exports = DataCollector;