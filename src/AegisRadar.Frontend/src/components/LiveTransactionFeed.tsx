import React, { useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { Pause, Play, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TransactionResponseDto } from "@/types/api";

interface LiveTransactionFeedProps {
  transactions: TransactionResponseDto[];
  isLoading?: boolean;
  onTransactionClick?: (transaction: TransactionResponseDto) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Approved":
      return "bg-green-500/20 text-green-400 border-green-500/50";
    case "Blocked":
      return "bg-red-500/20 text-red-400 border-red-500/50";
    case "Review":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
    case "Pending":
      return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/50";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Approved":
      return "•";
    case "Blocked":
      return "✕";
    case "Review":
      return "!";
    case "Pending":
      return "◐";
    default:
      return "•";
  }
};

const getFraudColor = (probability: number) => {
  if (probability < 0.3) return "bg-green-500/20 text-green-400 border-green-500/50";
  if (probability < 0.6) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
  return "bg-red-500/20 text-red-400 border-red-500/50";
};

export const LiveTransactionFeed: React.FC<LiveTransactionFeedProps> = ({
  transactions,
  isLoading = false,
  onTransactionClick,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [minFraudFilter, setMinFraudFilter] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const [displayedTransactions, setDisplayedTransactions] = useState<TransactionResponseDto[]>([]);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pausedSnapshotRef = useRef<TransactionResponseDto[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // When pausing, save the current snapshot
    if (isPaused) {
      pausedSnapshotRef.current = displayedTransactions;
      return;
    }

    // When running, throttle updates to every 800ms
    if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
    updateTimerRef.current = setTimeout(() => {
      const filtered = transactions
        .filter((t) => (t.prediction?.fraudProbability ?? 0) >= minFraudFilter)
        .filter((t) => !statusFilter || t.status === statusFilter)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 20);
      setDisplayedTransactions(filtered);
    }, 500);

    return () => {
      if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, isPaused, minFraudFilter, statusFilter]);

  // Track new IDs for animation
  const latestId = displayedTransactions[0]?.id;
  useEffect(() => {
    if (!latestId) return;
    setNewIds((prev) => new Set([...prev, latestId]));
    
    const timeout = setTimeout(() => {
      setNewIds((prev) => {
        const next = new Set(prev);
        next.delete(latestId);
        return next;
      });
    }, 2000); // Wait long enough for animation to finish

    return () => clearTimeout(timeout);
  }, [latestId]);

  const unreadCount = transactions.length;

  if (isLoading) {
    return (
      <div className="w-full h-full bg-slate-900/50 border border-slate-800 rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-slate-700 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Loading feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-900/50 border border-slate-800 rounded-lg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">Live Transactions</h3>
          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
            {unreadCount}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsPaused(!isPaused)}
            className={`gap-1 ${isPaused
              ? "border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
              : "border-slate-600 text-gray-300"}`}
          >
            {isPaused ? (
              <><Play className="w-4 h-4" /> Resume</>
            ) : (
              <><Pause className="w-4 h-4" /> Pause</>
            )}
          </Button>
        </div>
      </div>

      {isPaused && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-2 text-xs text-yellow-400 flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          Feed paused — new transactions are being collected
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-800/30 border-b border-slate-700 p-3 flex gap-2 items-center flex-wrap">
        <Filter className="w-4 h-4 text-gray-400" />
        <select
          value={statusFilter || ""}
          onChange={(e) => setStatusFilter(e.target.value || null)}
          className="px-2 py-1 text-sm bg-slate-900 border border-slate-700 rounded text-gray-300 hover:border-slate-600"
        >
          <option value="">All Status</option>
          <option value="Approved">Approved</option>
          <option value="Blocked">Blocked</option>
          <option value="Review">Review</option>
          <option value="Pending">Pending</option>
        </select>
        <select
          value={minFraudFilter}
          onChange={(e) => setMinFraudFilter(Number(e.target.value))}
          className="px-2 py-1 text-sm bg-slate-900 border border-slate-700 rounded text-gray-300 hover:border-slate-600"
        >
          <option value="0">Min Fraud: All</option>
          <option value="0.3">Min Fraud: 30%</option>
          <option value="0.5">Min Fraud: 50%</option>
          <option value="0.7">Min Fraud: 70%</option>
        </select>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto">
        {displayedTransactions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            No transactions match the filters
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {displayedTransactions.map((transaction, idx) => {
              const fraudProbability = transaction.prediction?.fraudProbability ?? 0;
              const customerLabel = "Customer " + (transaction.customerId?.slice(0, 8) ?? "Unknown");
              return (
                <div
                  key={transaction.id}
                  onClick={() => onTransactionClick?.(transaction)}
                  className={`p-3 rounded border transition-all duration-300 cursor-pointer ${
                    newIds.has(transaction.id) ? "transaction-new" : ""
                  } ${
                    idx === 0
                      ? "bg-slate-700/50 border-blue-500/50"
                      : "bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50 hover:bg-slate-700/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: Status and Amount */}
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <span
                        className={`mt-1 font-bold text-lg flex-shrink-0 ${
                          transaction.status === "Approved"
                            ? "text-green-400"
                            : transaction.status === "Blocked"
                              ? "text-red-400"
                              : transaction.status === "Review"
                                ? "text-yellow-400"
                                : "text-gray-400"
                        }`}
                      >
                        {getStatusIcon(transaction.status)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white text-sm">
                          {transaction.amount.toFixed(2)} {transaction.currency}
                        </div>
                        <div className="text-xs text-gray-400 truncate">{customerLabel}</div>
                      </div>
                    </div>

                    {/* Middle: Country and Fraud Badge */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs bg-slate-700 px-2 py-1 rounded text-gray-300">
                        {transaction.transactionCountry ?? "Unknown"}
                      </span>
                      <div
                        className={`text-xs font-semibold px-2 py-1 rounded border ${getFraudColor(
                          fraudProbability
                        )}`}
                      >
                        {(fraudProbability * 100).toFixed(0)}%
                      </div>
                    </div>

                    {/* Right: Time */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-xs text-gray-300 font-mono">
                        {new Date(transaction.createdAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false
                        })}
                      </div>
                      <div className="text-xs text-gray-600 font-mono">
                        {new Date(transaction.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric"
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-slate-800/50 border-t border-slate-700 px-4 py-2 text-xs text-gray-500">
        Showing {displayedTransactions.length} of {transactions.length} today
      </div>
    </div>
  );
};
