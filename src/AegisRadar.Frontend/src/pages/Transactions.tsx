import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/services/apiClient";
import { useDashboardStore } from "@/store/dashboardStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { toast } from "sonner";
import type { TransactionResponseDto } from "@/types/api";

const Transactions = () => {
  const [data, setData] = useState<TransactionResponseDto[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  // Subscribe to live transactions from the store (real-time updates on page 1)
  const liveTransactions = useDashboardStore((state) => state.transactions);

  const loadTransactions = useCallback(async (pageNum: number) => {
    setIsLoading(true);
    try {
      const result = await apiClient.transactions.getAll(pageNum, 15);
      setData(result);
      setHasMore(result.length === 15);
    } catch (err) {
      toast.error("Failed to load transactions");
      setData([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions(page);
  }, [page, loadTransactions]);

  // When page === 1, prepend any new live transactions to the displayed list
  useEffect(() => {
    if (page === 1 && liveTransactions.length > 0) {
      setData((prev) => {
        const existingIds = new Set(prev.map((t) => t.id));
        const newOnes = liveTransactions.filter((t) => !existingIds.has(t.id)).slice(0, 5);
        if (newOnes.length === 0) return prev;
        return [...newOnes, ...prev].slice(0, 15);
      });
    }
  }, [liveTransactions, page]);

  const handleDecision = async (
    tx: TransactionResponseDto,
    decision: "Approved" | "Blocked"
  ) => {
    const label = decision === "Approved" ? "Approve" : "Block";
    const confirmed = window.confirm(
      `Are you sure you want to ${label} this transaction?`
    );
    if (!confirmed) return;

    try {
      const updated = await apiClient.transactions.manualDecision(
        tx.id,
        decision,
        "Manual decision"
      );
      toast.success(`Transaction ${decision}`);
      setData((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
    } catch (err: any) {
      toast.error(err?.message || `Failed to ${label} transaction`);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-500/10 text-green-500 border border-green-500/20";
      case "Blocked":
        return "bg-red-500/10 text-red-500 border border-red-500/20";
      case "Review":
        return "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
    }
  };

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
            {/* Header row */}
            <div className="grid grid-cols-7 bg-muted/50 p-4 text-sm font-medium text-muted-foreground border-b border-border">
              <div>ID</div>
              <div>Amount</div>
              <div>Country</div>
              <div>Status</div>
              <div>Fraud %</div>
              <div>Date</div>
              <div>Action</div>
            </div>

            <div className="divide-y divide-border">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Loading transactions...
                </div>
              ) : data.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No transactions found.
                </div>
              ) : (
                data.map((tx) => {
                  const fraudPct = (tx.prediction?.fraudProbability ?? 0) * 100;
                  const canDecide =
                    tx.status === "Pending" || tx.status === "Review";
                  return (
                    <div
                      key={tx.id}
                      className="grid grid-cols-7 p-4 text-sm items-center hover:bg-muted/20 transition-colors"
                    >
                      {/* ID */}
                      <div
                        className="font-mono text-muted-foreground"
                        title={tx.id}
                      >
                        {tx.id.substring(0, 8)}
                      </div>

                      {/* Amount */}
                      <div className="font-medium font-mono">
                        {tx.amount.toFixed(2)} {tx.currency}
                      </div>

                      {/* Country */}
                      <div className="text-muted-foreground">{tx.country}</div>

                      {/* Status */}
                      <div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadgeClass(
                            tx.status
                          )}`}
                        >
                          {tx.status}
                        </span>
                      </div>

                      {/* Fraud % */}
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-secondary overflow-hidden">
                            <div
                              className={`h-full ${
                                fraudPct > 70
                                  ? "bg-red-500"
                                  : fraudPct > 30
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                              }`}
                              style={{ width: `${fraudPct}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {fraudPct.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleString()}
                      </div>

                      {/* Action */}
                      <div className="flex gap-1">
                        {canDecide ? (
                          <>
                            <button
                              onClick={() => handleDecision(tx, "Approved")}
                              className="px-2 py-1 text-xs bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-600/30 rounded transition-colors"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleDecision(tx, "Blocked")}
                              className="px-2 py-1 text-xs bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30 rounded transition-colors"
                            >
                              ✗ Block
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  );
                })
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
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
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
