import { MarketCapTable } from '@/components/market-cap-table';
import { Top10Evolution } from '@/components/top10-evolution';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getMarketCapData } from '@/lib/market-cap-data';

export default function Home() {
  const data = getMarketCapData();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Market Cap Tracker</h1>
        <p className="text-muted-foreground mt-2">
          Historical market capitalization data for companies that have ever been in the top 10
        </p>
        <div className="text-sm text-muted-foreground mt-1">
          Last updated: {data.metadata.last_updated} | Source: {data.metadata.data_source}
        </div>
      </div>

      <Tabs defaultValue="table" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="table">Market Cap Data</TabsTrigger>
          <TabsTrigger value="evolution">Top 10 Evolution</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-8">
          <MarketCapTable />
          
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Data Quality Legend:</strong></p>
            <div className="flex flex-wrap gap-4">
              <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                Real Data - From historical rankings
              </span>
              <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800">
                Estimate - Heuristic approximation
              </span>
              <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800">
                Interpolated - Calculated between known points
              </span>
              <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800">
                Historical - From various sources
              </span>
            </div>
            <p className="mt-4">
              <strong>Note:</strong> Market caps in billions USD. "PRIVATE" indicates company was not publicly traded. 
              All companies shown have been in the top 10 market cap at some point in history.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="evolution">
          <Top10Evolution />
        </TabsContent>
      </Tabs>
    </div>
  );
}
