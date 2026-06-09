import React, { useEffect, useState, useRef } from "react";
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

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Zustand stores
  const dashboardStore = useDashboardStore();
  const alertStore = useAlertStore();

  // Local state
  const [selectedRange, setSelectedRange] = useState<TimeRange>("24H");
  const [isLoadingChartData, setIsLoadingChartData] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionResponseDto | null>(null);

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
        await dashboardStore.loadInitialData();
        if (isMounted) await alertStore.loadAlerts();

        // Auto-generate demo data if no transactions exist today
        const currentStats = useDashboardStore.getState().stats;
        if (currentStats && currentStats.transactionsToday === 0) {
          try {
            await apiClient.instance.post(
              "/api/transactions/generate-demo?count=10"
            );
          } catch (e) {
            // silent fail — don't block dashboard on demo generation failure
          }
        }
      } catch (error) {
        console.error("Failed to initialize dashboard:", error);
        if (isMounted) toast.error("Failed to load dashboard data");
      } finally {
        if (isMounted) setIsLoadingChartData(false);
      }
    };

    // Only load if not already loaded
    if (!dashboardStore.stats) {
      initDashboard();
    }

    return () => {
      isMounted = false;
    };
  }, [user, navigate, dashboardStore, alertStore]);

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
          await dashboardStore.loadHistoricalTrends(days);
        } catch (error) {
          console.error("Failed to load chart data:", error);
          toast.error("Failed to load chart data");
        } finally {
          setIsLoadingChartData(false);
        }
      };

      loadRangeData();
    }
  }, [selectedRange, dashboardStore]);

  const unreadAlerts = alertStore.alerts.filter((a) => !a.isRead).length;

  // Generate Demo handler
  const handleGenerateDemo = async () => {
    try {
      await apiClient.instance.post("/api/transactions/generate-demo?count=10");
      toast.success("10 demo transactions submitted — watch live!");
    } catch (error) {
      toast.error("Failed to generate demo transactions");
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="bg-slate-900/50 border-b border-slate-800 sticky top-0 z-40 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">
              AegisRadar <span className="text-blue-500">Dashboard</span>
            </h1>
            <div className="ml-4 flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700">
              {dashboardStore.signalRStatus === "Connected" ? (
                <>
                  <Wifi className="w-3 h-3 text-green-500 animate-pulse" />
                  <span className="text-green-400 font-medium">Connected</span>
                </>
              ) : dashboardStore.signalRStatus === "Reconnecting" ? (
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
            {/* Generate Demo Button */}
            <button
              id="generate-demo-btn"
              onClick={handleGenerateDemo}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Generate Demo
            </button>
          </div>
          <div className="flex items-center gap-4">
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

      {/* Disconnection Banner */}
      {dashboardStore.signalRStatus !== "Connected" && (
        <div
          className={`px-6 py-4 flex items-center gap-3 border-b ${
            dashboardStore.signalRStatus === "Reconnecting"
              ? "bg-blue-500/10 border-blue-500/30"
              : "bg-red-500/10 border-red-500/30"
          }`}
        >
          {dashboardStore.signalRStatus === "Reconnecting" ? (
            <>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-blue-400">Reconnecting to live updates...</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-400">
                Connection lost — attempting to reconnect...
              </span>
            </>
          )}
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Bar */}
        <div className="mb-8">
          {dashboardStore.stats ? (
            <StatsBar 
              stats={dashboardStore.stats}
              unreadAlerts={unreadAlerts}
              avgFraudProbability={dashboardStore.chartData[dashboardStore.chartData.length - 1]?.avgFraudProbability ?? 0}
              isLoading={false} 
            />
          ) : (
            <div className="h-24 bg-slate-800/50 rounded animate-pulse"></div>
          )}
        </div>

        {/* Time Range Selector */}
        <div className="mb-8">
          <TimeRangeSelector
            selectedRange={selectedRange}
            onRangeChange={setSelectedRange}
            isLoading={isLoadingChartData}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Main Charts (70%) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transaction Volume Chart */}
            <TransactionVolumeChart
              data={dashboardStore.chartData}
              isLoading={isLoadingChartData}
            />

            {/* Two charts side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FraudProbabilityChart
                data={dashboardStore.chartData}
                isLoading={isLoadingChartData}
              />
              <TransactionAmountChart
                data={dashboardStore.chartData}
                isLoading={isLoadingChartData}
              />
            </div>

            {/* Decision Overview Chart */}
            <GeographyBarChart
              isLoading={dashboardStore.isLoading}
            />
          </div>

          {/* Right Column - Decision Donut (30%) */}
          <div className="space-y-6">
            <FraudDecisionDonut
              transactions={dashboardStore.transactions}
              isLoading={dashboardStore.isLoading}
            />
          </div>
        </div>

        {/* Live Transaction Feed */}
        <div className="mb-8">
          <div className="h-96">
            <LiveTransactionFeed
              transactions={dashboardStore.transactions}
              isLoading={false}
              onTransactionClick={setSelectedTransaction}
            />
          </div>
        </div>
      </main>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onReviewComplete={(updated) => {
          dashboardStore.updateTransaction(updated.id, {
            status: updated.status,
            prediction: updated.prediction,
          } as any);
          toast.success(`Transaction ${updated.status.toLowerCase()}`);
        }}
      />

      {/* Alerts Panel */}
      <AlertsPanel
        alerts={alertStore.alerts}
        onMarkAsRead={(alertId) => alertStore.markRead(alertId).catch(console.error)}
        onMarkAllAsRead={() => alertStore.markAllRead().catch(console.error)}
        isLoading={false}
      />

      {/* Connection Status Indicator */}
      <div className="fixed bottom-6 left-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800">
        <div
          className={`w-2 h-2 rounded-full ${
            dashboardStore.signalRStatus === "Connected"
              ? "bg-green-500"
              : dashboardStore.signalRStatus === "Reconnecting"
                ? "bg-yellow-500 animate-pulse"
                : "bg-red-500"
          }`}
        ></div>
        <span className="text-xs text-gray-400 font-medium">
          {dashboardStore.signalRStatus}
        </span>
      </div>
    </div>
  );
}
