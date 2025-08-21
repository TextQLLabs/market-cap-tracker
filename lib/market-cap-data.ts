// API base URL - will use relative URLs in production
const API_BASE = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api';

export interface MarketCapEntry {
  year: number;
  market_cap: number | string;
  citation: string;
  notes: string;
}

export interface Company {
  name: string;
  ticker: string;
  first_public_year: number;
  ever_top_10: boolean;
  exchange?: string;
  sector?: string;
}

export interface FlattenedEntry extends MarketCapEntry {
  company_name: string;
  company_ticker: string;
  first_public_year: number;
}

// Fetch companies from database
export async function getAllCompanies(): Promise<Company[]> {
  try {
    const response = await fetch(`${API_BASE}/market-data/companies`);
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching companies:', error);
    return [];
  }
}

// Fetch flattened market cap data from database
export async function getFlattenedMarketCapData(): Promise<FlattenedEntry[]> {
  try {
    const response = await fetch(`${API_BASE}/market-data/flattened-data`);
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching flattened data:', error);
    return [];
  }
}

// Fetch available years from database
export async function getAvailableYears(): Promise<number[]> {
  try {
    const response = await fetch(`${API_BASE}/market-data/available-years`);
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching available years:', error);
    return [];
  }
}

// Fetch yearly top 10 from database
export async function getYearlyTopTen(year: number): Promise<FlattenedEntry[]> {
  try {
    const response = await fetch(`${API_BASE}/market-data/yearly-top-ten/${year}`);
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching yearly top 10:', error);
    return [];
  }
}

// Get company by ticker (from flattened data)
export async function getCompanyByTicker(ticker: string): Promise<Company | undefined> {
  try {
    const companies = await getAllCompanies();
    return companies.find(c => c.ticker === ticker.toUpperCase());
  } catch (error) {
    console.error('Error fetching company by ticker:', error);
    return undefined;
  }
}

// Legacy function for backward compatibility - now returns empty metadata
export function getMarketCapData() {
  return {
    metadata: {
      description: "Historical market cap tracker - now using database",
      last_updated: new Date().toISOString().split('T')[0],
      currency: "USD",
      data_source: "SQLite Database with API integration",
      notes: "Data is now stored in SQLite database and updated daily"
    },
    companies: {}
  };
}