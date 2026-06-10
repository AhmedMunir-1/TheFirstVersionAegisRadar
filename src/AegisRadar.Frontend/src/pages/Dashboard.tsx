import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStore } from "@/store/dashboardStore";
import { useAlertStore } from "@/store/alertStore";
import { TimeRangeSelector, type TimeRange } from "@/components/TimeRangeSelector";
import { StatsBar } from "@/components/StatsBar";
import { LiveTransactionFeed } from "@/components/LiveTransactionFeed";
import { AlertsPanel } from "@/components/AlertsPanel";
import { TransactionDetailModal } from "@/components/TransactionDetailModal";
import {
  TransactionVolumeChart,
  FraudProbabilityChart,
  TransactionAmountChart,
  FraudDecisionDonut,
  GeographyBarChart,
} from "@/components/charts";
import { Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/services/apiClient";
import type { TransactionResponseDto } from "@/types/api";

// ─── Granular selectors — each extracts only what it needs ───────────────────
// This ensures only the sub-component that cares about a slice re-renders.

const useStats = () => useDashboardStore((s) => s.stats);
const useChartData = () => useDashboardStore((s) => s.chartData);
const useTransactions = () => useDashboardStore((s) => s.transactions);
const useSignalRStatus = () => useDashboardStore((s) => s.signalRStatus);
const useDashboardIsLoading = () => useDashboardStore((s) => s.isLoading);
const useLoadInitialData = () => useDashboardStore((s) => s.loadInitialData);
const useLoadHistoricalTrends = () =>
  useDashboardStore((s) => s.loadHistoricalTrends);
const useUpdateTransaction = () =>
  useDashboardStore((s) => s.updateTransaction);

const useAlerts = () => useAlertStore((s) => s.alerts);
const useLoadAlerts = () => useAlertStore((s) => s.loadAlerts);
const useMarkRead = () => useAlertStore((s) => s.markRead);
const useMarkAllRead = () => useAlertStore((s) => s.markAllRead);

// ─── Sub-components — isolated from each other's state changes ───────────────

const ConnectionBadge = React.memo(function ConnectionBadge() {
  const status = useSignalRStatus();
  return (
    <div className="ml-4 flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700">
      {status === "Connected" ? (
        <>
          <Wifi className="w-3 h-3 text-green-500 animate-pulse" />
          <span className="text-green-400 font-medium">Connected</span>
        </>
      ) : status === "Reconnecting" ? (
        <>
          <Wifi className="w-3 h-3 text-blue-500 animate-bounce" />
          <span className="text-blue-400 font-medium">Reconnecting...</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3 text-red-500 animate-pulse" />
          <span className="text-red-400 font-medium">Disconnected</span>
        </>
      )}
    </div>
  );
});

const DisconnectionBanner = React.memo(function DisconnectionBanner() {
  const status = useSignalRStatus();
  if (status === "Connected") return null;
  return (
    <div
      className={`px-6 py-4 flex items-center gap-3 border-b ${
        status === "Reconnecting"
          ? "bg-blue-500/10 border-blue-500/30"
          : "bg-red-500/10 border-red-500/30"
      }`}
    >
      {status === "Reconnecting" ? (
        <>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-sm text-blue-400">Reconnecting to live updates...</span>
        </>
      ) : (
        <>
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm text-red-400">
            Connection lost — attempting to reconnect...
          </span>
        </>
      )}
    </div>
  );
});

const ConnectionStatusFooter = React.memo(function ConnectionStatusFooter() {
  const status = useSignalRStatus();
  return (
    <div className="fixed bottom-6 left-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800">
      <div
        className={`w-2 h-2 rounded-full ${
          status === "Connected"
            ? "bg-green-500"
            : status === "Reconnecting"
              ? "bg-yellow-500 animate-pulse"
              : "bg-red-500"
        }`}
      />
      <span className="text-xs text-gray-400 font-medium">{status}</span>
    </div>
  );
});

const DashboardStatsBar = React.memo(function DashboardStatsBar({
  unreadAlerts,
  isLoading,
}: {
  unreadAlerts: number;
  isLoading: boolean;
}) {
  const stats = useStats();
  const chartData = useChartData();
  if (!stats) {
    return <div className="h-24 bg-slate-800/50 rounded animate-pulse" />;
  }
  return (
    <StatsBar
      stats={stats}
      unreadAlerts={unreadAlerts}
      avgFraudProbability={chartData[chartData.length - 1]?.avgFraudProbability ?? 0}
      isLoading={isLoading}
    />
  );
});

const DashboardCharts = React.memo(function DashboardCharts({
  isLoadingChartData,
}: {
  isLoadingChartData: boolean;
}) {
  const chartData = useChartData();
  const transactions = useTransactions();
  const isLoading = useDashboardIsLoading();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Left Column - Main Charts (70%) */}
      <div className="lg:col-span-2 space-y-6">
        <TransactionVolumeChart />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FraudProbabilityChart data={chartData} isLoading={isLoadingChartData} />
          <TransactionAmountChart data={chartData} isLoading={isLoadingChartData} />
        </div>
        <GeographyBarChart isLoading={isLoading} />
      </div>

      {/* Right Column - Decision Donut (30%) */}
      <div className="space-y-6">
        <FraudDecisionDonut transactions={transactions} isLoading={isLoading} />
      </div>
    </div>
  );
});

const DashboardTransactionFeed = React.memo(function DashboardTransactionFeed({
  onTransactionClick,
}: {
  onTransactionClick: (tx: TransactionResponseDto) => void;
}) {
  const transactions = useTransactions();
  return (
    <div className="mb-8">
      <div className="h-96">
        <LiveTransactionFeed
          transactions={transactions}
          isLoading={false}
          onTransactionClick={onTransactionClick}
        />
      </div>
    </div>
  );
});

const NotificationsBell = React.memo(function NotificationsBell() {
  const alerts = useAlerts();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  return (
    <AlertsPanel
      alerts={alerts}
      onMarkAsRead={(id) => markRead(id).catch(console.error)}
      onMarkAllAsRead={() => markAllRead().catch(console.error)}
      isLoading={false}
    />
  );
});

// ─── Main Dashboard Component ─────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Only subscribe to actions — these are stable references (don't trigger re-renders)
  const loadInitialData = useLoadInitialData();
  const loadHistoricalTrends = useLoadHistoricalTrends();
  const updateTransaction = useUpdateTransaction();
  const loadAlerts = useLoadAlerts();

  // Derived read-only values needed at this level
  const stats = useStats();
  const alerts = useAlerts();

  const [selectedRange, setSelectedRange] = useState<TimeRange>("24H");
  const [isLoadingChartData, setIsLoadingChartData] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionResponseDto | null>(null);

  const unreadAlerts = alerts.filter((a) => !a.isRead).length;

  // Initialize dashboard data on mount (only once)
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    let isMounted = true;

    const initDashboard = async () => {
      try {
        setIsLoadingChartData(true);
        await loadInitialData();
        if (isMounted) await loadAlerts();

      } catch (error) {
        console.error("Failed to initialize dashboard:", error);
        if (isMounted) toast.error("Failed to load dashboard data");
      } finally {
        if (isMounted) setIsLoadingChartData(false);
      }
    };

    // Only load if not already loaded
    if (!stats) {
      initDashboard();
    }

    return () => {
      isMounted = false;
    };
  }, [user, navigate, loadInitialData, loadAlerts, stats]);

  // Handle time range selection (fetch historical data if needed)
  useEffect(() => {
    if (
      selectedRange === "7D" ||
      selectedRange === "30D" ||
      selectedRange === "1Y" ||
      selectedRange === "5Y"
    ) {
      const loadRangeData = async () => {
        setIsLoadingChartData(true);
        try {
          const days =
            selectedRange === "7D"
              ? 7
              : selectedRange === "30D"
                ? 30
                : selectedRange === "1Y"
                  ? 365
                  : 1825;
          await loadHistoricalTrends(days);
        } catch (error) {
          console.error("Failed to load chart data:", error);
          toast.error("Failed to load chart data");
        } finally {
          setIsLoadingChartData(false);
        }
      };

      loadRangeData();
    }
  }, [selectedRange, loadHistoricalTrends]);

  // Stable handler for transaction review completion
  const handleReviewComplete = useCallback(
    (updated: TransactionResponseDto) => {
      updateTransaction(updated.id, {
        status: updated.status,
        prediction: updated.prediction,
      } as any);
      toast.success(`Transaction ${updated.status.toLowerCase()}`);
    },
    [updateTransaction]
  );

  // Stable handler for closing modal
  const handleCloseModal = useCallback(() => setSelectedTransaction(null), []);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="bg-slate-900/50 border-b border-slate-800 sticky top-0 z-40 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">
              AegisRadar <span className="text-blue-500">Dashboard</span>
            </h1>
            <ConnectionBadge />
          </div>
          <div className="flex items-center gap-4">
            {/* Notifications Dropdown — isolated, re-renders only on alert changes */}
            <NotificationsBell />

            <span className="text-sm text-gray-400">{user?.email}</span>
            <button
              onClick={logout}
              className="text-sm px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-gray-300 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Disconnection Banner — isolated, re-renders only on status change */}
      <DisconnectionBanner />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Bar — re-renders only when stats or chartData changes */}
        <div className="mb-8">
          <DashboardStatsBar
            unreadAlerts={unreadAlerts}
            isLoading={false}
          />
        </div>

        {/* Time Range Selector */}
        <div className="mb-8">
          <TimeRangeSelector
            selectedRange={selectedRange}
            onRangeChange={setSelectedRange}
            isLoading={isLoadingChartData}
          />
        </div>

        {/* Charts Grid — re-renders only when chartData or transactions changes */}
        <DashboardCharts isLoadingChartData={isLoadingChartData} />

        {/* Live Transaction Feed — re-renders only when transactions batch is flushed */}
        <DashboardTransactionFeed onTransactionClick={setSelectedTransaction} />
      </main>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        onClose={handleCloseModal}
        onReviewComplete={handleReviewComplete}
      />

      {/* Connection Status Indicator — isolated */}
      <ConnectionStatusFooter />
    </div>
  );
}
