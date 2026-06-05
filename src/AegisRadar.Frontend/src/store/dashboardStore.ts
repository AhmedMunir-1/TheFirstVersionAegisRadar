import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Transaction, Alert } from "@/services/signalRService";

export interface ChartDataPoint {
  timestamp: string;
  transactionCount: number;
  fraudCount: number;
  totalAmount: number;
  avgFraudProbability: number;
}

export interface DashboardStats {
  totalTransactionsToday: number;
  totalAmountToday: number;
  fraudRateToday: number;
  blockedCount: number;
  approvedCount: number;
  pendingReviewCount: number;
  avgProcessingTimeMs: number;
}

export interface DashboardState {
  // Data
  transactions: Transaction[];
  alerts: Alert[];
  stats: DashboardStats;
  chartData: ChartDataPoint[];
  signalRStatus: "Connecting" | "Connected" | "Disconnected" | "Reconnecting";

  // Actions
  addTransaction: (transaction: Transaction) => void;
  addAlert: (alert: Alert) => void;
  markAlertAsRead: (alertId: string) => void;
  markAllAlertsAsRead: () => void;
  setChartData: (data: ChartDataPoint[]) => void;
  updateStats: (stats: Partial<DashboardStats>) => void;
  setSignalRStatus: (status: DashboardState["signalRStatus"]) => void;
  reset: () => void;
}

const initialStats: DashboardStats = {
  totalTransactionsToday: 0,
  totalAmountToday: 0,
  fraudRateToday: 0,
  blockedCount: 0,
  approvedCount: 0,
  pendingReviewCount: 0,
  avgProcessingTimeMs: 0,
};

export const useDashboardStore = create<DashboardState>()(
  immer((set) => ({
    transactions: [],
    alerts: [],
    stats: initialStats,
    chartData: [],
    signalRStatus: "Disconnected",

    addTransaction: (transaction) => {
      set((state) => {
        // Add to front of array (most recent first)
        state.transactions.unshift(transaction);

        // Keep only last 500 transactions
        if (state.transactions.length > 500) {
          state.transactions = state.transactions.slice(0, 500);
        }

        // Update stats
        state.stats.totalTransactionsToday += 1;
        state.stats.totalAmountToday += transaction.amount;

        // Update status counts
        if (transaction.status === "Approved") state.stats.approvedCount += 1;
        if (transaction.status === "Blocked") state.stats.blockedCount += 1;
        if (transaction.status === "Review") state.stats.pendingReviewCount += 1;

        // Update fraud rate
        const totalFraudRisk = state.transactions
          .slice(0, 100)
          .reduce((sum, t) => sum + t.fraudProbability, 0);
        state.stats.fraudRateToday = (totalFraudRisk / Math.min(state.transactions.length, 100)) * 100;

        // Update average processing time
        const avgTime =
          state.transactions.slice(0, 100).reduce((sum, t) => sum + t.processingTimeMs, 0) /
          Math.min(state.transactions.length, 100);
        state.stats.avgProcessingTimeMs = Math.round(avgTime);
      });
    },

    addAlert: (alert) => {
      set((state) => {
        state.alerts.unshift(alert);

        // Keep only last 100 alerts
        if (state.alerts.length > 100) {
          state.alerts = state.alerts.slice(0, 100);
        }
      });
    },

    markAlertAsRead: (alertId) => {
      set((state) => {
        const alert = state.alerts.find((a) => a.id === alertId);
        if (alert) {
          alert.isRead = true;
        }
      });
    },

    markAllAlertsAsRead: () => {
      set((state) => {
        state.alerts.forEach((alert) => {
          alert.isRead = true;
        });
      });
    },

    setChartData: (data) => {
      set((state) => {
        state.chartData = data;
      });
    },

    updateStats: (stats) => {
      set((state) => {
        state.stats = { ...state.stats, ...stats };
      });
    },

    setSignalRStatus: (status) => {
      set((state) => {
        state.signalRStatus = status;
      });
    },

    reset: () => {
      set((state) => {
        state.transactions = [];
        state.alerts = [];
        state.stats = initialStats;
        state.chartData = [];
        state.signalRStatus = "Disconnected";
      });
    },
  }))
);
