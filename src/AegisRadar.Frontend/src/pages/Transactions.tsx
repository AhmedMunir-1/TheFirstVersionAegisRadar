import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  riskScore: number;
  decision: string;
  createdAt: string;
}

const Transactions = () => {
  const [data, setData] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const loadTransactions = async (pageNum: number) => {
    setIsLoading(true);
    // Backend expects 'page' not 'pageNumber'
    const res = await fetchApi<any[]>(`/api/transactions?page=${pageNum}&pageSize=15`);
    if (res.success && Array.isArray(res.data)) {
      const mapped = res.data.map(tx => ({
        id: tx.id,
        amount: tx.amount,
        riskScore: tx.prediction?.fraudProbability ?? (tx.status?.toLowerCase() === 'blocked' ? 0.95 : tx.status?.toLowerCase() === 'review' ? 0.5 : 0.05),
        decision: tx.prediction?.decision?.toLowerCase() ?? tx.status?.toLowerCase() ?? 'approved',
        createdAt: tx.createdAt
      }));
      setData(mapped);
      setHasMore(mapped.length === 15);
    } else {
      setData([]);
      setHasMore(false);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadTransactions(page);
  }, [page]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Transactions</h2>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card className="bg-card-gradient border-border shadow-sm">
        <CardContent className="p-0">
          <div className="rounded-md">
            <div className="grid grid-cols-5 bg-muted/50 p-4 text-sm font-medium text-muted-foreground border-b border-border">
              <div>Transaction ID</div>
              <div>Amount (EGP)</div>
              <div>Risk Score</div>
              <div>Decision</div>
              <div>Date & Time</div>
            </div>
            <div className="divide-y divide-border">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading transactions...</div>
              ) : data.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No transactions found.</div>
              ) : (
                data.map(tx => (
                  <div key={tx.id} className="grid grid-cols-5 p-4 text-sm items-center hover:bg-muted/20 transition-colors">
                    <div className="font-mono text-muted-foreground" title={tx.id}>
                      {tx.id.substring(0, 8)}...
                    </div>
                    <div className="font-medium font-mono">{tx.amount.toFixed(2)}</div>
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="w-16 h-2 rounded-full bg-secondary overflow-hidden">
                                <div 
                                    className={`h-full ${tx.riskScore > 0.7 ? 'bg-red-500' : tx.riskScore > 0.3 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                    style={{ width: `${tx.riskScore * 100}%` }}
                                />
                            </div>
                            <span className="text-xs text-muted-foreground">{(tx.riskScore * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                    <div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                        tx.decision === 'approved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                        tx.decision === 'review' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                        'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}>
                        {tx.decision}
                      </span>
                    </div>
                    <div className="text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Page <span className="font-medium text-foreground">{page}</span>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => p + 1)}
                disabled={!hasMore || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;

