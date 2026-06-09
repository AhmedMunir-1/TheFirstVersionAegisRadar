import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { apiClient } from "@/services/apiClient";
import type {
  DashboardStatsDto,
  FraudTrendDto,
  TransactionResponseDto,
  ChartDataPoint,
} from "@/types/api";

export interface DashboardState {
  // Data
  transactions: TransactionResponseDto[];
  stats: DashboardStatsDto | null;
  trends: FraudTrendDto[];
  chartData: ChartDataPoint[];
  signalRStatus: "Connecting" | "Connected" | "Disconnected" | "Reconnecting";
  isLoading: boolean;
  error: string | null;

  // Batching for chart updates
  pendingChartUpdates: Array<{ amount: number; fraudProbability: number }>;

  // Actions
  loadInitialData: () => Promise<void>;
  addTransaction: (transaction: TransactionResponseDto) => void;
  updateTransaction: (id: string, updates: Partial<TransactionResponseDto>) => void;
  setChartData: (data: ChartDataPoint[]) => void;
  updateCurrentMinuteBucket: (transaction: TransactionResponseDto) => void;
  flushPendingChartUpdates: () => void;
  setSignalRStatus: (status: DashboardState["signalRStatus"]) => void;
  loadHistoricalTrends: (days: number) => Promise<void>;
  setStats: (stats: DashboardStatsDto) => void;
  reset: () => void;
}

/** Map a FraudTrendDto (real backend fields) to a ChartDataPoint */
const trendToChartPoint = (trend: FraudTrendDto): ChartDataPoint => ({
  timestamp: new Date(trend.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  }),
  transactionCount: trend.transactionCount ?? 0,
  fraudCount: trend.fraudCount ?? 0,
  totalAmount: trend.totalAmount ?? 0,
  avgFraudProbability: trend.avgFraudProbability ?? 0,
});

/** Build a single-point fallback chart from today's stats when trends array is empty */
const statsToFallbackChartPoint = (stats: DashboardStatsDto): ChartDataPoint => ({
  timestamp: "Today",
  transactionCount: stats.totalTransactionsToday ?? 0,
  fraudCount: Math.round(((stats.fraudRateToday ?? 0) / 100) * (stats.totalTransactionsToday ?? 0)),
  totalAmount: stats.totalAmountToday ?? 0,
  avgFraudProbability: (stats.fraudRateToday ?? 0) / 100,
});

export const useDashboardStore = create<DashboardState>()(
  immer((set, get) => ({
    transactions: [],
    stats: null,
    trends: [],
    chartData: [],
    signalRStatus: "Connected",
    isLoading: false,
    error: null,
    pendingChartUpdates: [],

    loadInitialData: async () => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout — backend may be unreachable")), 10000)
        );

        const [stats, trends, recent] = await Promise.race([
          Promise.all([
            apiClient.dashboard.getStats(),
            apiClient.dashboard.getTrends(7),
            apiClient.dashboard.getRecent(50),
          ]),
          timeoutPromise,
        ]) as [DashboardStatsDto, FraudTrendDto[], TransactionResponseDto[]];

        // Debug: remove after confirming field names are correct
        console.log("STATS FROM API:", JSON.stringify(stats));
        console.log("TRENDS FROM API:", JSON.stringify(trends?.slice(0, 2)));
        console.log("RECENT FROM API:", JSON.stringify(recent?.slice(0, 1)));

        set((state) => {
          state.stats = stats;
          state.trends = trends;
          state.transactions = recent;
          state.isLoading = false;

          // Map trends to chart data; fall back to a stats-based point if empty
          if (trends && trends.length > 0) {
            state.chartData = trends.map(trendToChartPoint);
          } else if (stats) {
            state.chartData = [statsToFallbackChartPoint(stats)];
          } else {
            state.chartData = [];
          }
        });
      } catch (error) {
        console.error("loadInitialData error:", error);
        set((state) => {
          state.error = error instanceof Error ? error.message : "Failed to load dashboard data";
          state.isLoading = false;
        });
      }
    },

    addTransaction: (transaction) => {
      set((state) => {
        state.transactions.unshift(transaction);
        if (state.transactions.length > 500) {
          state.transactions = state.transactions.slice(0, 500);
        }

        // Update today's counts
        if (state.stats) {
          state.stats.totalTransactionsToday += 1;
          state.stats.totalAmountToday += transaction.amount;
          if (transaction.status === "Blocked") {
            state.stats.blockedCount += 1;
            state.stats.fraudulentCount += 1;
          }
          if (transaction.status === "Review") {
            state.stats.reviewCount += 1;
            state.stats.pendingReviewCount += 1;
          }
          if (transaction.status === "Approved") {
            state.stats.approvedCount += 1;
          }
          // Recalculate fraudRateToday
          const todayTotal = state.stats.totalTransactionsToday;
          const todayBlocked = Math.round(((state.stats.fraudRateToday ?? 0) / 100) * (todayTotal - 1));
          const newBlocked = todayBlocked + (transaction.status === "Blocked" ? 1 : 0);
          state.stats.fraudRateToday = todayTotal > 0 ? (newBlocked / todayTotal) * 100 : 0;
        }
      });
    },

    updateTransaction: (id: string, updates) => {
      set((state) => {
        const idx = state.transactions.findIndex((t) => t.id === id);
        if (idx !== -1) {
          state.transactions[idx] = { ...state.transactions[idx], ...updates };
        }
      });
    },

    setChartData: (data) => {
      set((state) => {
        state.chartData = data;
      });
    },

    updateCurrentMinuteBucket: (transaction) => {
      set((state) => {
        state.pendingChartUpdates.push({
          amount: transaction.amount,
          fraudProbability: transaction.prediction?.fraudProbability ?? 0,
        });
      });
    },

    flushPendingChartUpdates: () => {
      set((state) => {
        if (state.chartData.length === 0 || state.pendingChartUpdates.length === 0) {
          state.pendingChartUpdates = [];
          return;
        }

        const lastPoint = state.chartData[state.chartData.length - 1];

        for (const update of state.pendingChartUpdates) {
          lastPoint.transactionCount += 1;
          lastPoint.totalAmount += update.amount;
          if (update.fraudProbability > 0.5) {
            lastPoint.fraudCount += 1;
          }
        }

        const totalFraud = state.chartData.reduce((sum, p) => sum + p.fraudCount, 0);
        const totalTxs = state.chartData.reduce((sum, p) => sum + p.transactionCount, 0);
        lastPoint.avgFraudProbability = totalTxs > 0 ? totalFraud / totalTxs : 0;

        state.pendingChartUpdates = [];
      });
    },

    setSignalRStatus: (status) => {
      set((state) => {
        state.signalRStatus = status;
      });
    },

    loadHistoricalTrends: async (days: number) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const trends = await apiClient.dashboard.getTrends(days);
        set((state) => {
          state.trends = trends;
          if (trends && trends.length > 0) {
            state.chartData = trends.map(trendToChartPoint);
          } else if (state.stats) {
            state.chartData = [statsToFallbackChartPoint(state.stats)];
          }
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : "Failed to load trends";
          state.isLoading = false;
        });
      }
    },

    setStats: (stats) => {
      set((state) => {
        state.stats = stats;
      });
    },

    reset: () => {
      set((state) => {
        state.transactions = [];
        state.stats = null;
        state.trends = [];
        state.chartData = [];
        state.signalRStatus = "Disconnected";
        state.isLoading = false;
        state.error = null;
        state.pendingChartUpdates = [];
      });
    },
  }))
);

export type { ChartDataPoint };
