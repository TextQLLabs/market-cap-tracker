const express = require('express');
const Database = require('../config/database');

const router = express.Router();
const db = new Database();

// Get flattened market cap data (replaces JSON file reading)
router.get('/flattened-data', async (req, res) => {
  try {
    const data = await db.all(`
      SELECT 
        h.ticker as company_ticker,
        c.name as company_name,
        c.first_public_year,
        CAST(substr(h.date, 1, 4) AS INTEGER) as year,
        h.market_cap,
        h.source as citation,
        'From database: ' || h.source as notes
      FROM market_cap_history h
      JOIN companies c ON h.ticker = c.ticker
      WHERE h.market_cap IS NOT NULL AND h.market_cap > 0
      ORDER BY 
        CAST(substr(h.date, 1, 4) AS INTEGER) DESC,
        h.market_cap DESC,
        h.ticker ASC
    `);
    
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error getting flattened data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available years
router.get('/available-years', async (req, res) => {
  try {
    const years = await db.all(`
      SELECT DISTINCT CAST(substr(date, 1, 4) AS INTEGER) as year
      FROM market_cap_history
      WHERE market_cap IS NOT NULL AND market_cap > 0
      ORDER BY year DESC
    `);
    
    res.json({
      success: true,
      data: years.map(row => row.year)
    });
  } catch (error) {
    console.error('Error getting available years:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get yearly top 10
router.get('/yearly-top-ten/:year', async (req, res) => {
  try {
    const { year } = req.params;
    
    const data = await db.all(`
      SELECT 
        h.ticker as company_ticker,
        c.name as company_name,
        c.first_public_year,
        ? as year,
        h.market_cap,
        h.price,
        h.source as citation,
        'From database: ' || h.source as notes
      FROM market_cap_history h
      JOIN companies c ON h.ticker = c.ticker
      WHERE CAST(substr(h.date, 1, 4) AS INTEGER) = ? 
        AND h.market_cap IS NOT NULL 
        AND h.market_cap > 0
      ORDER BY h.market_cap DESC
      LIMIT 10
    `, [parseInt(year), parseInt(year)]);
    
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error(`Error getting yearly top 10 for ${req.params.year}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all companies
router.get('/companies', async (req, res) => {
  try {
    const companies = await db.all(`
      SELECT 
        ticker,
        name,
        first_public_year,
        ever_top_10,
        exchange,
        sector
      FROM companies
      ORDER BY name
    `);
    
    res.json({
      success: true,
      data: companies
    });
  } catch (error) {
    console.error('Error getting companies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;