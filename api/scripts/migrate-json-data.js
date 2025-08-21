const Database = require('../config/database');
const fs = require('fs');
const path = require('path');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

class JSONMigrator {
  constructor() {
    this.db = new Database();
  }

  async migrateHistoricalData() {
    logger.info('Starting migration of JSON data to SQLite database...');
    
    try {
      // Load the historical JSON data
      const jsonPath = path.join(__dirname, '../../market_caps_data_updated.json');
      
      if (!fs.existsSync(jsonPath)) {
        logger.warn('JSON file not found, skipping migration');
        return;
      }

      const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      const companies = jsonData.companies;
      
      let companiesProcessed = 0;
      let dataPointsInserted = 0;

      for (const [ticker, companyData] of Object.entries(companies)) {
        // Insert/update company info
        await this.db.run(`
          INSERT OR REPLACE INTO companies (
            ticker, name, first_public_year, ever_top_10, 
            exchange, sector, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          ticker,
          companyData.name,
          companyData.first_public_year,
          companyData.ever_top_10 ? 1 : 0,
          'UNKNOWN', // We don't have this in JSON
          'UNKNOWN', // We don't have this in JSON
        ]);

        // Insert historical market cap data
        for (const historyEntry of companyData.market_cap_history) {
          const { year, market_cap, citation, notes } = historyEntry;
          
          // Skip PRIVATE entries
          if (market_cap === 'PRIVATE') continue;
          
          // Convert market cap to number if it's a string
          const marketCapValue = typeof market_cap === 'number' ? market_cap : parseFloat(market_cap) || null;
          
          if (!marketCapValue) continue;

          // Estimate price (market cap / estimated shares)
          // This is rough since we don't have historical shares outstanding
          const estimatedShares = marketCapValue * 1000000; // Rough estimate in millions
          const estimatedPrice = marketCapValue / estimatedShares * 1000000; // Back to per share

          await this.db.run(`
            INSERT OR REPLACE INTO market_cap_history (
              ticker, date, price, market_cap, shares_outstanding,
              volume, change_percent, source, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `, [
            ticker,
            `${year}-12-31`, // Use Dec 31 as the date for yearly data
            estimatedPrice || marketCapValue, // Fallback to market cap if price calc fails
            marketCapValue,
            estimatedShares, // Estimated shares outstanding
            null, // No volume data
            null, // No change percent
            this.mapCitationToSource(citation)
          ]);

          dataPointsInserted++;
        }

        companiesProcessed++;
        logger.info(`Processed ${ticker}: ${companyData.market_cap_history.length} data points`);
      }

      // Update current rankings based on the latest year data (2025)
      await this.updateCurrentRankings();

      logger.info(`Migration completed successfully:`);
      logger.info(`- Companies processed: ${companiesProcessed}`);
      logger.info(`- Data points inserted: ${dataPointsInserted}`);
      
      return { companiesProcessed, dataPointsInserted };

    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    }
  }

  mapCitationToSource(citation) {
    if (citation.includes('User provided data')) {
      return 'historical_rankings';
    } else if (citation.includes('HEURISTIC')) {
      return 'heuristic_estimate';
    } else if (citation.includes('INTERPOLATED')) {
      return 'interpolated';
    } else if (citation.includes('Yahoo Finance')) {
      return 'yahoo';
    } else if (citation.includes('SEC')) {
      return 'sec';
    } else {
      return 'unknown';
    }
  }

  async updateCurrentRankings() {
    try {
      // Clear current rankings
      await this.db.run('DELETE FROM current_rankings');
      
      // Insert new rankings based on latest data (2025)
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
          WHERE market_cap IS NOT NULL AND date LIKE '2025%'
          GROUP BY ticker
        ) latest ON h.ticker = latest.ticker AND h.date = latest.max_date
        WHERE h.market_cap > 0
        ORDER BY h.market_cap DESC
        LIMIT 50
      `);
      
      logger.info('Updated current rankings based on 2025 data');
    } catch (error) {
      logger.error('Error updating rankings:', error);
      throw error;
    }
  }

  async cleanup() {
    await this.db.close();
  }
}

// CLI execution
if (require.main === module) {
  const migrator = new JSONMigrator();
  
  async function runMigration() {
    try {
      const results = await migrator.migrateHistoricalData();
      console.log('✅ Migration completed successfully!');
      console.log(`📊 Processed ${results.companiesProcessed} companies`);
      console.log(`📈 Inserted ${results.dataPointsInserted} data points`);
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    } finally {
      await migrator.cleanup();
    }
  }
  
  runMigration();
}

module.exports = JSONMigrator;