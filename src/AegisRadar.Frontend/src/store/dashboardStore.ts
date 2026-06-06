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

  // Actions
  loadInitialData: () => Promise<void>;
  addTransaction: (transaction: TransactionResponseDto) => void;
  updateTransaction: (id: string, updates: Partial<TransactionResponseDto>) => void;
  setChartData: (data: ChartDataPoint[]) => void;
  updateCurrentMinuteBucket: (transaction: TransactionResponseDto) => void;
  setSignalRStatus: (status: DashboardState["signalRStatus"]) => void;
  loadHistoricalTrends: (days: number) => Promise<void>;
  setStats: (stats: DashboardStatsDto) => void;
  reset: () => void;
}

const generateMockChartData = (range: "1H" | "6H" | "24H" | "7D" | "30D" | "1Y" | "5Y"): ChartDataPoint[] => {
  const dataPoints = 
    range === "1H" ? 60 :
    range === "6H" ? 60 :
    range === "24H" ? 24 :
    range === "7D" ? 7 :
    range === "30D" ? 30 :
    range === "1Y" ? 52 : 60;

  const now = new Date();
  const data: ChartDataPoint[] = [];

  for (let i = dataPoints - 1; i >= 0; i--) {
    const date = new Date(now);
    if (range === "1H") date.setMinutes(date.getMinutes() - i);
    else if (range === "6H") date.setMinutes(date.getMinutes() - i * 6);
    else if (range === "24H") date.setHours(date.getHours() - i);
    else if (range === "7D") date.setDate(date.getDate() - i);
    else if (range === "30D") date.setDate(date.getDate() - i);
    else date.setFullYear(date.getFullYear() - i);

    const timestamp =
      range === "24H" || range === "6H" || range === "1H"
        ? date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
        : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    data.push({
      timestamp,
      transactionCount: Math.floor(Math.random() * 50) + 10,
      fraudCount: Math.floor(Math.random() * 15) + 2,
      totalAmount: Math.random() * 100000 + 10000,
      avgFraudProbability: Math.random() * 0.5 + 0.2,
    });
  }

  return data;
};

export const useDashboardStore = create<DashboardState>()(
  immer((set, get) => ({
    transactions: [],
    stats: null,
    trends: [],
    chartData: [],
    signalRStatus: "Disconnected",
    isLoading: false,
    error: null,

    loadInitialData: async () => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const [stats, trends, recent] = await Promise.all([
          apiClient.dashboard.getStats(),
          apiClient.dashboard.getTrends(7),
          apiClient.dashboard.getRecent(50),
        ]);

        set((state) => {
          state.stats = stats;
          state.trends = trends;
          state.transactions = recent;
          state.isLoading = false;
          // Generate initial chart data from trends
          state.chartData = trends.map((trend) => ({
            timestamp: new Date(trend.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            transactionCount: trend.transactionCount,
            fraudCount: trend.fraudCount,
            totalAmount: trend.totalAmount,
            avgFraudProbability: trend.avgFraudProbability,
          }));
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : "Failed to load dashboard data";
          state.isLoading = false;
          // Fallback to mock data
          state.chartData = generateMockChartData("24H");
        });
      }
    },

    addTransaction: (transaction) => {
      set((state) => {
        // Add to front of array (most recent first)
        state.transactions.unshift(transaction);

        // Keep only last 500 transactions
        if (state.transactions.length > 500) {
          state.transactions = state.transactions.slice(0, 500);
        }

        // Update stats
        if (state.stats) {
          state.stats.totalTransactionsToday += 1;
          state.stats.totalAmountToday += transaction.amount;

          // Update status counts
          if (transaction.status === "Approved") state.stats.approvedCount += 1;
          if (transaction.status === "Blocked") state.stats.blockedCount += 1;
          if (transaction.status === "Review") state.stats.pendingReviewCount += 1;

          // Update fraud rate based on recent transactions
          const recentTxs = state.transactions.slice(0, 100);
          const fraudCount = recentTxs.filter((t) => (t.prediction?.fraudProbability || 0) > 0.5).length;
          state.stats.fraudRateToday = (fraudCount / recentTxs.length) * 100;
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
        if (state.chartData.length === 0) return;

        const lastPoint = state.chartData[state.chartData.length - 1];
        lastPoint.transactionCount += 1;
        lastPoint.totalAmount += transaction.amount;

        if ((transaction.prediction?.fraudProbability || 0) > 0.5) {
          lastPoint.fraudCount += 1;
        }

        // Recalculate average fraud probability
        const totalFraud =
          state.chartData.reduce((sum, p) => sum + p.fraudCount, 0);
        const totalTxs =
          state.chartData.reduce((sum, p) => sum + p.transactionCount, 0);
        lastPoint.avgFraudProbability = totalTxs > 0 ? totalFraud / totalTxs : 0;
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
          state.chartData = trends.map((trend) => ({
            timestamp: new Date(trend.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            transactionCount: trend.transactionCount,
            fraudCount: trend.fraudCount,
            totalAmount: trend.totalAmount,
            avgFraudProbability: trend.avgFraudProbability,
          }));
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
      });
    },
  }))
);

export type { ChartDataPoint };
