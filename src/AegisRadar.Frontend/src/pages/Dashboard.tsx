import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStore } from "@/store/dashboardStore";
import { useAlertStore } from "@/store/alertStore";
import { useSignalR } from "@/hooks/useSignalR";
import { TimeRangeSelector, type TimeRange } from "@/components/TimeRangeSelector";
import { StatsBar } from "@/components/StatsBar";
import { LiveTransactionFeed } from "@/components/LiveTransactionFeed";
import { AlertsPanel } from "@/components/AlertsPanel";
import { TransactionVolumeChart } from "@/components/charts/TransactionVolumeChart";
import { FraudProbabilityChart } from "@/components/charts/FraudProbabilityChart";
import { TransactionAmountChart } from "@/components/charts/TransactionAmountChart";
import { FraudDecisionDonut } from "@/components/charts/FraudDecisionDonut";
import { GeographyBarChart } from "@/components/charts/GeographyBarChart";
import { Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Initialize SignalR
  useSignalR();

  // Zustand stores
  const dashboardStore = useDashboardStore();
  const alertStore = useAlertStore();

  // Local state
  const [selectedRange, setSelectedRange] = useState<TimeRange>("24H");
  const [isLoadingChartData, setIsLoadingChartData] = useState(false);
  const chartUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize dashboard data on mount
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const initDashboard = async () => {
      try {
        setIsLoadingChartData(true);
        await dashboardStore.loadInitialData();
        await alertStore.loadAlerts();
        setIsLoadingChartData(false);
      } catch (error) {
        console.error("Failed to initialize dashboard:", error);
        setIsLoadingChartData(false);
        toast.error("Failed to load dashboard data");
      }
    };

    initDashboard();
  }, [user, navigate, dashboardStore, alertStore]);

  // Handle time range selection
  useEffect(() => {
    const loadRangeData = async () => {
      setIsLoadingChartData(true);
      try {
        if (selectedRange === "1H" || selectedRange === "6H" || selectedRange === "24H") {
          // For short ranges, use current chart data (real-time)
          // The data is already being updated by SignalR
        } else {
          // For longer ranges, fetch historical data
          const days =
            selectedRange === "7D"
              ? 7
              : selectedRange === "30D"
                ? 30
                : selectedRange === "1Y"
                  ? 365
                  : 1825; // 5Y

          await dashboardStore.loadHistoricalTrends(days);
        }
        setIsLoadingChartData(false);
      } catch (error) {
        console.error("Failed to load chart data:", error);
        setIsLoadingChartData(false);
        toast.error("Failed to load chart data");
      }
    };

    loadRangeData();
  }, [selectedRange, dashboardStore]);

  // Auto-increment chart data every minute for real-time ranges
  useEffect(() => {
    if (chartUpdateIntervalRef.current) clearInterval(chartUpdateIntervalRef.current);

    if (selectedRange === "24H" || selectedRange === "6H" || selectedRange === "1H") {
      chartUpdateIntervalRef.current = setInterval(() => {
        const { chartData, setChartData } = dashboardStore;
        if (chartData.length === 0) return;

        const updated = [...chartData];
        const now = new Date();
        const newTimestamp = now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        // Remove oldest and add new
        updated.shift();
        updated.push({
          timestamp: newTimestamp,
          transactionCount: Math.floor(Math.random() * 30) + 5,
          fraudCount: Math.floor(Math.random() * 10) + 1,
          totalAmount: Math.random() * 80000 + 5000,
          avgFraudProbability: Math.random() * 0.4 + 0.2,
        });

        setChartData(updated);
      }, 60000); // Every minute
    }

    return () => {
      if (chartUpdateIntervalRef.current) clearInterval(chartUpdateIntervalRef.current);
    };
  }, [selectedRange, dashboardStore]);

  const unreadAlerts = alertStore.alerts.filter((a) => !a.isRead).length;

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
                  <Wifi className="w-3 h-3 text-green-400" />
                  <span className="text-green-400 font-medium">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-red-400" />
                  <span className="text-red-400 font-medium">{dashboardStore.signalRStatus}</span>
                </>
              )}
            </div>
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
        <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-6 py-3 flex items-center gap-3">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-yellow-400">
            Live updates paused — reconnecting...
          </span>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Bar */}
        <div className="mb-8">
          {dashboardStore.stats ? (
            <StatsBar stats={dashboardStore.stats} isLoading={false} />
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

            {/* Geography Chart */}
            <GeographyBarChart
              transactions={dashboardStore.transactions}
              isLoading={false}
            />
          </div>

          {/* Right Column - Decision Donut (30%) */}
          <div className="space-y-6">
            <FraudDecisionDonut
              transactions={dashboardStore.transactions}
              isLoading={false}
            />
          </div>
        </div>

        {/* Live Transaction Feed */}
        <div className="mb-8">
          <div className="h-96">
            <LiveTransactionFeed
              transactions={dashboardStore.transactions}
              isLoading={false}
            />
          </div>
        </div>
      </main>

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
