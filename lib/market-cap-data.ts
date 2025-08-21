import marketCapData from './market_caps_data_updated.json';

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
  market_cap_history: MarketCapEntry[];
}

export interface MarketCapData {
  metadata: {
    description: string;
    last_updated: string;
    currency: string;
    data_source: string;
    notes: string;
  };
  companies: Record<string, Company>;
}

export function getMarketCapData(): MarketCapData {
  return marketCapData as MarketCapData;
}

export function getAllCompanies(): Company[] {
  const data = getMarketCapData();
  return Object.entries(data.companies).map(([ticker, company]) => ({
    ...company,
    ticker: ticker,
  }));
}

export function getCompanyByTicker(ticker: string): Company | undefined {
  const data = getMarketCapData();
  const company = data.companies[ticker];
  return company ? { ...company, ticker } : undefined;
}

// Get all market cap entries flattened with company info
export interface FlattenedEntry extends MarketCapEntry {
  company_name: string;
  company_ticker: string;
  first_public_year: number;
}

export function getFlattenedMarketCapData(): FlattenedEntry[] {
  const companies = getAllCompanies();
  const entries: FlattenedEntry[] = [];

  companies.forEach(company => {
    company.market_cap_history.forEach(entry => {
      entries.push({
        ...entry,
        company_name: company.name,
        company_ticker: company.ticker,
        first_public_year: company.first_public_year,
      });
    });
  });

  return entries.sort((a, b) => {
    // Sort by year descending, then by market cap descending, then by ticker for stability
    if (a.year !== b.year) {
      return b.year - a.year;
    }
    
    const aMarketCap = typeof a.market_cap === 'number' ? a.market_cap : 0;
    const bMarketCap = typeof b.market_cap === 'number' ? b.market_cap : 0;
    
    if (aMarketCap !== bMarketCap) {
      return bMarketCap - aMarketCap;
    }
    
    // Stable sort by ticker when values are equal
    return a.company_ticker.localeCompare(b.company_ticker);
  });
}

export function getYearlyTopTen(year: number): FlattenedEntry[] {
  const allEntries = getFlattenedMarketCapData();
  return allEntries
    .filter(entry => entry.year === year && typeof entry.market_cap === 'number')
    .sort((a, b) => {
      const aMarketCap = a.market_cap as number;
      const bMarketCap = b.market_cap as number;
      
      if (aMarketCap !== bMarketCap) {
        return bMarketCap - aMarketCap;
      }
      
      // Stable sort by ticker when market caps are equal
      return a.company_ticker.localeCompare(b.company_ticker);
    })
    .slice(0, 10);
}

export function getAvailableYears(): number[] {
  const allEntries = getFlattenedMarketCapData();
  const years = Array.from(new Set(allEntries.map(entry => entry.year)));
  return years.sort((a, b) => b - a);
}

// Helper interfaces for top 10 evolution analysis
export interface RankedCompany extends FlattenedEntry {
  rank: number;
}

export interface YearComparison {
  year: number;
  companies: RankedCompany[];
  newEntrants: RankedCompany[];
  exiters: RankedCompany[];
  movers: Array<{
    company: RankedCompany;
    previousRank: number;
    rankChange: number;
  }>;
}

export interface FallenAngel {
  company_name: string;
  company_ticker: string;
  bestYear: number;
  bestRank: number;
  bestMarketCap: number;
  currentYear: number;
  currentRank: number | null;
  currentMarketCap: number | string;
  yearsInTop10: number;
}

export function getTop10ForYear(year: number): RankedCompany[] {
  const yearlyData = getYearlyTopTen(year);
  return yearlyData.map((company, index) => ({
    ...company,
    rank: index + 1
  }));
}

export function compareYears(currentYear: number, previousYear: number): YearComparison {
  const currentTop10 = getTop10ForYear(currentYear);
  const previousTop10 = getTop10ForYear(previousYear);
  
  const previousCompanyMap = new Map(
    previousTop10.map(company => [company.company_ticker, company])
  );
  
  const currentCompanySet = new Set(
    currentTop10.map(company => company.company_ticker)
  );
  
  const previousCompanySet = new Set(
    previousTop10.map(company => company.company_ticker)
  );
  
  // New entrants: in current but not in previous
  const newEntrants = currentTop10.filter(
    company => !previousCompanySet.has(company.company_ticker)
  );
  
  // Exiters: in previous but not in current
  const exiters = previousTop10.filter(
    company => !currentCompanySet.has(company.company_ticker)
  );
  
  // Movers: companies that moved positions
  const movers = currentTop10
    .filter(company => previousCompanySet.has(company.company_ticker))
    .map(company => {
      const previousCompany = previousCompanyMap.get(company.company_ticker)!;
      return {
        company,
        previousRank: previousCompany.rank,
        rankChange: previousCompany.rank - company.rank // positive means moved up
      };
    })
    .filter(mover => mover.rankChange !== 0);
  
  return {
    year: currentYear,
    companies: currentTop10,
    newEntrants,
    exiters,
    movers
  };
}

export function getFallenAngels(): FallenAngel[] {
  const companies = getAllCompanies();
  const fallenAngels: FallenAngel[] = [];
  const currentYear = 2025;
  const currentTop10Set = new Set(
    getTop10ForYear(currentYear).map(c => c.company_ticker)
  );
  
  companies.forEach(company => {
    // Get all years where the company was in top 10
    const top10Years: Array<{year: number, rank: number, marketCap: number}> = [];
    const availableYears = getAvailableYears();
    
    availableYears.forEach(year => {
      const yearTop10 = getTop10ForYear(year);
      const companyInTop10 = yearTop10.find(c => c.company_ticker === company.ticker);
      if (companyInTop10) {
        top10Years.push({
          year,
          rank: companyInTop10.rank,
          marketCap: companyInTop10.market_cap as number
        });
      }
    });
    
    // If company was ever in top 10 but isn't currently
    if (top10Years.length > 0 && !currentTop10Set.has(company.ticker)) {
      const bestPerformance = top10Years.reduce((best, current) => 
        current.rank < best.rank ? current : best
      );
      
      // Get current status
      const currentEntry = company.market_cap_history.find(entry => entry.year === currentYear);
      let currentRank: number | null = null;
      
      // Calculate current rank among all companies for this year
      if (currentEntry && typeof currentEntry.market_cap === 'number') {
        const allCurrentYearCompanies = getFlattenedMarketCapData()
          .filter(entry => entry.year === currentYear && typeof entry.market_cap === 'number')
          .sort((a, b) => (b.market_cap as number) - (a.market_cap as number));
        
        currentRank = allCurrentYearCompanies.findIndex(c => c.company_ticker === company.ticker) + 1;
      }
      
      fallenAngels.push({
        company_name: company.name,
        company_ticker: company.ticker,
        bestYear: bestPerformance.year,
        bestRank: bestPerformance.rank,
        bestMarketCap: bestPerformance.marketCap,
        currentYear,
        currentRank,
        currentMarketCap: currentEntry?.market_cap || 'N/A',
        yearsInTop10: top10Years.length
      });
    }
  });
  
  // Sort by best historical rank, then by years in top 10
  return fallenAngels.sort((a, b) => {
    if (a.bestRank !== b.bestRank) {
      return a.bestRank - b.bestRank;
    }
    return b.yearsInTop10 - a.yearsInTop10;
  });
}

export function getCompanyStats() {
  const companies = getAllCompanies();
  const availableYears = getAvailableYears();
  
  const stats = {
    mostYearsInTop10: { company: '', years: 0 },
    biggestGainer: { company: '', change: 0, fromYear: 0, toYear: 0 },
    biggestLoser: { company: '', change: 0, fromYear: 0, toYear: 0 },
    longestReigning: { company: '', consecutiveYears: 0, startYear: 0 }
  };
  
  companies.forEach(company => {
    // Count years in top 10
    let yearsInTop10 = 0;
    let consecutiveYears = 0;
    let currentConsecutive = 0;
    let consecutiveStart = 0;
    
    availableYears.forEach(year => {
      const yearTop10 = getTop10ForYear(year);
      const isInTop10 = yearTop10.some(c => c.company_ticker === company.ticker);
      
      if (isInTop10) {
        yearsInTop10++;
        currentConsecutive++;
        if (currentConsecutive === 1) {
          consecutiveStart = year;
        }
      } else {
        if (currentConsecutive > consecutiveYears) {
          consecutiveYears = currentConsecutive;
          stats.longestReigning = {
            company: company.name,
            consecutiveYears,
            startYear: consecutiveStart
          };
        }
        currentConsecutive = 0;
      }
    });
    
    // Final check for consecutive years
    if (currentConsecutive > consecutiveYears) {
      stats.longestReigning = {
        company: company.name,
        consecutiveYears: currentConsecutive,
        startYear: consecutiveStart
      };
    }
    
    if (yearsInTop10 > stats.mostYearsInTop10.years) {
      stats.mostYearsInTop10 = {
        company: company.name,
        years: yearsInTop10
      };
    }
    
    // Calculate biggest market cap changes
    const marketCapEntries = company.market_cap_history
      .filter(entry => typeof entry.market_cap === 'number')
      .sort((a, b) => a.year - b.year);
    
    for (let i = 1; i < marketCapEntries.length; i++) {
      const prev = marketCapEntries[i - 1];
      const curr = marketCapEntries[i];
      const change = ((curr.market_cap as number) - (prev.market_cap as number)) / (prev.market_cap as number) * 100;
      
      if (change > stats.biggestGainer.change) {
        stats.biggestGainer = {
          company: company.name,
          change,
          fromYear: prev.year,
          toYear: curr.year
        };
      }
      
      if (change < stats.biggestLoser.change) {
        stats.biggestLoser = {
          company: company.name,
          change,
          fromYear: prev.year,
          toYear: curr.year
        };
      }
    }
  });
  
  return stats;
}