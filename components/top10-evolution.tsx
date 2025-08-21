'use client'

import React, { useState, useMemo } from 'react';
import { 
  getAvailableYears, 
  getTop10ForYear, 
  compareYears,
  getFallenAngels,
  getCompanyStats,
  type RankedCompany,
  type YearComparison,
  type FallenAngel
} from '@/lib/market-cap-data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { ArrowUp, ArrowDown, Minus, Star, TrendingUp, TrendingDown, Download } from 'lucide-react';

export function Top10Evolution() {
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [comparisonYear, setComparisonYear] = useState<number | null>(2024);
  const [view, setView] = useState<'evolution' | 'fallen-angels' | 'stats'>('evolution');
  
  const availableYears = useMemo(() => getAvailableYears(), []);
  const currentYearData = useMemo(() => getTop10ForYear(selectedYear), [selectedYear]);
  const yearComparison = useMemo(() => {
    if (comparisonYear) {
      return compareYears(selectedYear, comparisonYear);
    }
    return null;
  }, [selectedYear, comparisonYear]);
  
  const fallenAngels = useMemo(() => getFallenAngels(), []);
  const companyStats = useMemo(() => getCompanyStats(), []);

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCurrentView = () => {
    if (view === 'evolution') {
      const exportData = currentYearData.map(company => {
        const comparison = yearComparison?.movers.find(m => m.company.company_ticker === company.company_ticker);
        const isNewEntrant = yearComparison?.newEntrants.some(c => c.company_ticker === company.company_ticker);
        
        return {
          rank: company.rank,
          company_name: company.company_name,
          ticker: company.company_ticker,
          market_cap_billions: typeof company.market_cap === 'number' ? company.market_cap : company.market_cap,
          year: selectedYear,
          previous_rank: comparison ? comparison.previousRank : (isNewEntrant ? 'New Entrant' : 'N/A'),
          rank_change: comparison ? comparison.rankChange : (isNewEntrant ? 'New' : 'N/A'),
          status: isNewEntrant ? 'New Entrant' : comparison && comparison.rankChange > 0 ? 'Moved Up' : comparison && comparison.rankChange < 0 ? 'Moved Down' : 'Stable'
        };
      });
      exportToCSV(exportData, `top10-evolution-${selectedYear}`);
    } else if (view === 'fallen-angels') {
      const exportData = fallenAngels.map(angel => ({
        company_name: angel.company_name,
        ticker: angel.company_ticker,
        best_rank: angel.bestRank,
        best_year: angel.bestYear,
        best_market_cap_billions: angel.bestMarketCap,
        current_rank: angel.currentRank || 'N/A',
        current_market_cap_billions: typeof angel.currentMarketCap === 'number' ? angel.currentMarketCap : angel.currentMarketCap,
        years_in_top10: angel.yearsInTop10
      }));
      exportToCSV(exportData, 'fallen-angels');
    } else if (view === 'stats') {
      const exportData = [
        { metric: 'Most Years in Top 10', company: companyStats.mostYearsInTop10.company, value: companyStats.mostYearsInTop10.years },
        { metric: 'Longest Consecutive Reign', company: companyStats.longestReigning.company, value: `${companyStats.longestReigning.consecutiveYears} years` },
        { metric: 'Biggest Gainer', company: companyStats.biggestGainer.company, value: `${companyStats.biggestGainer.change.toFixed(1)}%` },
        { metric: 'Biggest Loser', company: companyStats.biggestLoser.company, value: `${companyStats.biggestLoser.change.toFixed(1)}%` }
      ];
      exportToCSV(exportData, 'market-cap-stats');
    }
  };

  const formatMarketCap = (marketCap: number | string): string => {
    if (typeof marketCap === 'string') {
      return marketCap;
    }
    
    if (marketCap >= 1000) {
      return `$${(marketCap / 1000).toFixed(1)}T`;
    } else {
      return `$${marketCap.toFixed(1)}B`;
    }
  };

  const getRankChangeIcon = (rankChange: number) => {
    if (rankChange > 0) {
      return <ArrowUp className="h-4 w-4 text-green-600" />;
    } else if (rankChange < 0) {
      return <ArrowDown className="h-4 w-4 text-red-600" />;
    } else {
      return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRankChangeColor = (rankChange: number) => {
    if (rankChange > 0) return 'text-green-600';
    if (rankChange < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getCompanyTypeColor = (company: RankedCompany, comparison: YearComparison | null) => {
    if (!comparison) return '';
    
    if (comparison.newEntrants.some(c => c.company_ticker === company.company_ticker)) {
      return 'bg-green-50 border-l-4 border-green-500';
    }
    
    const mover = comparison.movers.find(m => m.company.company_ticker === company.company_ticker);
    if (mover && Math.abs(mover.rankChange) > 0) {
      return mover.rankChange > 0 ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-orange-50 border-l-4 border-orange-500';
    }
    
    return 'bg-gray-50 border-l-4 border-gray-300';
  };

  const renderEvolutionView = () => (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div>
            <label className="block text-sm font-medium mb-2">Primary Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground min-w-[120px]"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Compare With</label>
            <select
              value={comparisonYear || ''}
              onChange={(e) => setComparisonYear(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground min-w-[120px]"
            >
              <option value="">No comparison</option>
              {availableYears
                .filter(year => year !== selectedYear)
                .map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
            </select>
          </div>
        </div>
        
        {yearComparison && (
          <div className="flex flex-wrap gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>New ({yearComparison.newEntrants.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Moved Up ({yearComparison.movers.filter(m => m.rankChange > 0).length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Moved Down ({yearComparison.movers.filter(m => m.rankChange < 0).length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300 rounded"></div>
              <span>Stable ({currentYearData.length - (yearComparison.newEntrants.length + yearComparison.movers.length)})</span>
            </div>
          </div>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Market Cap</TableHead>
              {comparisonYear && <TableHead>vs {comparisonYear}</TableHead>}
              <TableHead>Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentYearData.map((company) => {
              const comparison = yearComparison?.movers.find(m => m.company.company_ticker === company.company_ticker);
              const isNewEntrant = yearComparison?.newEntrants.some(c => c.company_ticker === company.company_ticker);
              
              return (
                <TableRow 
                  key={company.company_ticker} 
                  className={getCompanyTypeColor(company, yearComparison)}
                >
                  <TableCell className="font-bold text-lg">
                    #{company.rank}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium">{company.company_name}</div>
                        <div className="text-sm text-muted-foreground font-mono">{company.company_ticker}</div>
                      </div>
                      {isNewEntrant && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                          NEW
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-lg">
                    {formatMarketCap(company.market_cap)}
                  </TableCell>
                  {comparisonYear && (
                    <TableCell>
                      {comparison ? (
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${getRankChangeColor(comparison.rankChange)}`}>
                            #{comparison.previousRank}
                          </span>
                          {getRankChangeIcon(comparison.rankChange)}
                        </div>
                      ) : isNewEntrant ? (
                        <span className="text-green-600 text-sm">Not in top 10</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    {comparison && (
                      <div className={`flex items-center gap-1 ${getRankChangeColor(comparison.rankChange)}`}>
                        {getRankChangeIcon(comparison.rankChange)}
                        <span className="font-medium">
                          {Math.abs(comparison.rankChange)} position{Math.abs(comparison.rankChange) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                    {isNewEntrant && (
                      <div className="flex items-center gap-1 text-green-600">
                        <Star className="h-4 w-4" />
                        <span className="font-medium">Entered top 10</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {yearComparison && yearComparison.exiters.length > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 text-red-800">
            Companies that exited top 10 in {selectedYear}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {yearComparison.exiters.map((company) => (
              <div key={company.company_ticker} className="bg-red-50 p-3 rounded border-l-4 border-red-500">
                <div className="font-medium">{company.company_name}</div>
                <div className="text-sm text-muted-foreground">
                  Was #{company.rank} in {comparisonYear} ({formatMarketCap(company.market_cap)})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderFallenAngelsView = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Fallen Angels</h2>
        <p className="text-muted-foreground mb-4">
          Companies that were once in the top 10 but have since fallen out of the rankings.
        </p>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Best Position</TableHead>
              <TableHead>Peak Market Cap</TableHead>
              <TableHead>Current Rank</TableHead>
              <TableHead>Current Market Cap</TableHead>
              <TableHead>Years in Top 10</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fallenAngels.map((angel) => (
              <TableRow key={angel.company_ticker}>
                <TableCell>
                  <div>
                    <div className="font-medium">{angel.company_name}</div>
                    <div className="text-sm text-muted-foreground font-mono">{angel.company_ticker}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">#{angel.bestRank}</span>
                    <span className="text-sm text-muted-foreground">in {angel.bestYear}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono">
                  {formatMarketCap(angel.bestMarketCap)}
                </TableCell>
                <TableCell>
                  {angel.currentRank ? (
                    <span className="font-medium">#{angel.currentRank}</span>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </TableCell>
                <TableCell className="font-mono">
                  {formatMarketCap(angel.currentMarketCap)}
                </TableCell>
                <TableCell>
                  <span className="font-medium">{angel.yearsInTop10}</span>
                  <span className="text-sm text-muted-foreground ml-1">year{angel.yearsInTop10 !== 1 ? 's' : ''}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  const renderStatsView = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Key Statistics</h2>
        <p className="text-muted-foreground mb-6">
          Insights from 45 years of market cap data (1980-2025).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold">Most Years in Top 10</h3>
          </div>
          <div className="text-3xl font-bold text-blue-600 mb-2">{companyStats.mostYearsInTop10.company}</div>
          <div className="text-muted-foreground">{companyStats.mostYearsInTop10.years} years</div>
        </div>

        <div className="border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Star className="h-6 w-6 text-yellow-600" />
            <h3 className="text-lg font-semibold">Longest Consecutive Reign</h3>
          </div>
          <div className="text-3xl font-bold text-yellow-600 mb-2">{companyStats.longestReigning.company}</div>
          <div className="text-muted-foreground">
            {companyStats.longestReigning.consecutiveYears} years
            {companyStats.longestReigning.startYear > 0 && ` (starting ${companyStats.longestReigning.startYear})`}
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold">Biggest Gainer</h3>
          </div>
          <div className="text-2xl font-bold text-green-600 mb-2">{companyStats.biggestGainer.company}</div>
          <div className="text-muted-foreground">
            +{companyStats.biggestGainer.change.toFixed(0)}% 
            ({companyStats.biggestGainer.fromYear} → {companyStats.biggestGainer.toYear})
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingDown className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-semibold">Biggest Loser</h3>
          </div>
          <div className="text-2xl font-bold text-red-600 mb-2">{companyStats.biggestLoser.company}</div>
          <div className="text-muted-foreground">
            {companyStats.biggestLoser.change.toFixed(0)}% 
            ({companyStats.biggestLoser.fromYear} → {companyStats.biggestLoser.toYear})
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Facts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Companies Tracked:</span>
            <span className="font-medium">{fallenAngels.length + 10}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fallen Angels:</span>
            <span className="font-medium">{fallenAngels.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Years Covered:</span>
            <span className="font-medium">1980-2025 (45 years)</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Top 10 Evolution</h1>
          <p className="text-muted-foreground mt-1">
            How the top 10 largest companies have changed over time
          </p>
        </div>
        
        <div className="flex gap-2">
          <div className="flex gap-2 mr-4">
            <button
              onClick={() => setView('evolution')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'evolution' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Evolution
            </button>
            <button
              onClick={() => setView('fallen-angels')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'fallen-angels' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Fallen Angels
            </button>
            <button
              onClick={() => setView('stats')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'stats' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Statistics
            </button>
          </div>
          <button
            onClick={exportCurrentView}
            className="px-4 py-2 rounded-md text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {view === 'evolution' && renderEvolutionView()}
      {view === 'fallen-angels' && renderFallenAngelsView()}
      {view === 'stats' && renderStatsView()}
    </div>
  );
}