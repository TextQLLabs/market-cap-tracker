const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    const dbDir = path.dirname(process.env.DATABASE_PATH || './data/market_caps.db');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    this.db = new sqlite3.Database(process.env.DATABASE_PATH || './data/market_caps.db');
    this.init();
  }

  init() {
    // Companies table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticker TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        exchange TEXT,
        sector TEXT,
        industry TEXT,
        country TEXT DEFAULT 'US',
        shares_outstanding REAL,
        ipo_date DATE,
        is_active BOOLEAN DEFAULT 1,
        logo_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Market cap history table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS market_cap_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticker TEXT NOT NULL,
        date DATE NOT NULL,
        price REAL NOT NULL,
        market_cap REAL NOT NULL,
        shares_outstanding REAL,
        volume INTEGER,
        change_percent REAL,
        source TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(ticker, date),
        FOREIGN KEY (ticker) REFERENCES companies (ticker)
      )
    `);

    // Current rankings table (for fast queries)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS current_rankings (
        rank INTEGER PRIMARY KEY,
        ticker TEXT NOT NULL,
        market_cap REAL NOT NULL,
        price REAL NOT NULL,
        change_percent REAL,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticker) REFERENCES companies (ticker)
      )
    `);

    // Data collection log
    this.db.run(`
      CREATE TABLE IF NOT EXISTS collection_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT NOT NULL,
        status TEXT NOT NULL,
        companies_updated INTEGER DEFAULT 0,
        errors TEXT,
        duration_ms INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for performance
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_market_cap_history_ticker_date ON market_cap_history (ticker, date DESC)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_market_cap_history_date ON market_cap_history (date DESC)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_current_rankings_market_cap ON current_rankings (market_cap DESC)`);
  }

  // Helper methods
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close(err => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = Database;