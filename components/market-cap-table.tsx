'use client'

import React, { useState, useMemo } from 'react';
import { 
  getFlattenedMarketCapData, 
  getAvailableYears, 
  getYearlyTopTen,
  type FlattenedEntry 
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

export function MarketCapTable() {
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'market_cap' | 'company_name' | 'year'>('year');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const availableYears = useMemo(() => getAvailableYears(), []);
  const currentYear = 2025; // Current year for top 10 highlighting
  
  const data = useMemo(() => {
    if (selectedYear === 'all') {
      return getFlattenedMarketCapData();
    } else {
      return getYearlyTopTen(selectedYear);
    }
  }, [selectedYear]);

  // Get current year's top 10 for highlighting
  const currentYearTop10 = useMemo(() => {
    const currentYearData = getYearlyTopTen(currentYear);
    return new Set(currentYearData.map(entry => entry.company_ticker));
  }, [currentYear]);

  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(entry => 
        entry.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.company_ticker.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort data with stable sorting
    return filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'market_cap') {
        aValue = typeof aValue === 'number' ? aValue : 0;
        bValue = typeof bValue === 'number' ? bValue : 0;
      }

      let comparison = 0;
      if (aValue > bValue) {
        comparison = 1;
      } else if (aValue < bValue) {
        comparison = -1;
      }

      // If values are equal, sort by ticker for stability
      if (comparison === 0) {
        comparison = a.company_ticker.localeCompare(b.company_ticker);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, searchQuery, sortField, sortDirection]);

  const handleSort = (field: 'market_cap' | 'company_name' | 'year') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
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

  const getCitationDisplay = (citation: string): string => {
    if (citation.includes('User provided data')) {
      return 'Real Data';
    } else if (citation.includes('HEURISTIC')) {
      return 'Estimate';
    } else if (citation.includes('INTERPOLATED')) {
      return 'Interpolated';
    } else if (citation === 'N/A') {
      return 'N/A';
    }
    return 'Historical';
  };

  const getCitationColor = (citation: string): string => {
    if (citation.includes('User provided data')) {
      return 'bg-green-100 text-green-800';
    } else if (citation.includes('HEURISTIC')) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (citation.includes('INTERPOLATED')) {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const isCurrentYearTop10 = (entry: FlattenedEntry): boolean => {
    return entry.year === currentYear && currentYearTop10.has(entry.company_ticker);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
          className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
        >
          <option value="all">All Years</option>
          {availableYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredAndSortedData.length} entries
        {selectedYear !== 'all' && ` for ${selectedYear}`}
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('company_name')}
              >
                Company {sortField === 'company_name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Ticker</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('year')}
              >
                Year {sortField === 'year' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('market_cap')}
              >
                Market Cap {sortField === 'market_cap' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Data Source</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedData.map((entry) => (
              <TableRow 
                key={`${entry.company_ticker}-${entry.year}-${typeof entry.market_cap === 'number' ? entry.market_cap : entry.market_cap}`}
                className={isCurrentYearTop10(entry) ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : undefined}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {entry.company_name}
                    {isCurrentYearTop10(entry) && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                        2025 TOP 10
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {entry.company_ticker}
                </TableCell>
                <TableCell>{entry.year}</TableCell>
                <TableCell className="font-mono">
                  {formatMarketCap(entry.market_cap)}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getCitationColor(entry.citation)}`}>
                    {getCitationDisplay(entry.citation)}
                  </span>
                </TableCell>
                <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                  {entry.notes}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}