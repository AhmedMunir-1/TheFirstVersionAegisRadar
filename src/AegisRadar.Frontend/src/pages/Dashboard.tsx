import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStore, type ChartDataPoint } from "@/store/dashboardStore";
import { signalRService, type Transaction } from "@/services/signalRService";
import { TimeRangeSelector, type TimeRange } from "@/components/TimeRangeSelector";
import { StatsBar } from "@/components/StatsBar";
import { LiveTransactionFeed } from "@/components/LiveTransactionFeed";
import { AlertsPanel } from "@/components/AlertsPanel";
import { TransactionVolumeChart } from "@/components/charts/TransactionVolumeChart";
import { FraudProbabilityChart } from "@/components/charts/FraudProbabilityChart";
import { TransactionAmountChart } from "@/components/charts/TransactionAmountChart";
import { FraudDecisionDonut } from "@/components/charts/FraudDecisionDonut";
import { GeographyBarChart } from "@/components/charts/GeographyBarChart";
import { Bell, Wifi, WifiOff } from "lucide-react";


const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5099";

// Generate mock chart data for development
const generateMockChartData = (range: TimeRange, existingData: ChartDataPoint[] = []): ChartDataPoint[] => {
  const dataPoints = range === "1H" || range === "6H" || range === "24H" ? 60 : range === "7D" ? 7 : range === "30D" ? 30 : 365;
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

    const timestamp = range === "24H" || range === "6H" || range === "1H"
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

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const store = useDashboardStore();
  const [selectedRange, setSelectedRange] = useState<TimeRange>("24H");
  const [isLoadingChartData, setIsLoadingChartData] = useState(false);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const chartUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize SignalR connection
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const initSignalR = async () => {
      try {
        await signalRService.connect();
      } catch (error) {
        console.error("Failed to connect to SignalR:", error);
      }
    };

    initSignalR();

    // Subscribe to SignalR events
    const unsubscribeTransaction = signalRService.onTransactionReceived((transaction) => {
      store.addTransaction(transaction);
      // Update current minute bucket in chart data
      updateCurrentMinuteBucket(transaction);
    });

    const unsubscribeAlert = signalRService.onAlertCreated((alert) => {
      store.addAlert(alert);
    });

    const unsubscribeStatus = signalRService.onConnectionStatusChanged((status) => {
      store.setSignalRStatus(status);
    });

    return () => {
      unsubscribeTransaction();
      unsubscribeAlert();
      unsubscribeStatus();
    };
  }, [user, navigate, store]);

  // Load initial chart data based on selected range
  useEffect(() => {
    const loadChartData = async () => {
      setIsLoadingChartData(true);
      try {
        // In production, fetch from API based on range
        // For now, use mock data
        const data = generateMockChartData(selectedRange);
        setChartData(data);
      } catch (error) {
        console.error("Failed to load chart data:", error);
        // Fallback to mock data
        setChartData(generateMockChartData(selectedRange));
      } finally {
        setIsLoadingChartData(false);
      }
    };

    loadChartData();
  }, [selectedRange]);

  // Update current minute bucket with new transaction
  const updateCurrentMinuteBucket = useCallback((transaction: Transaction) => {
    setChartData((prev) => {
      if (prev.length === 0) return prev;

      const updated = [...prev];
      const lastPoint = updated[updated.length - 1];

      // Update the last data point
      lastPoint.transactionCount += 1;
      lastPoint.totalAmount += transaction.amount;

      if (transaction.fraudProbability > 0.5) {
        lastPoint.fraudCount += 1;
      }

      // Recalculate average fraud probability
      const avgFraud = (lastPoint.fraudCount + (lastPoint.transactionCount - lastPoint.fraudCount) * 0.3) / lastPoint.transactionCount;
      lastPoint.avgFraudProbability = Math.min(avgFraud, 1);

      return updated;
    });
  }, []);

  // Auto-generate new data points every minute
  useEffect(() => {
    if (chartUpdateIntervalRef.current) clearInterval(chartUpdateIntervalRef.current);

    if (selectedRange === "24H" || selectedRange === "6H" || selectedRange === "1H") {
      chartUpdateIntervalRef.current = setInterval(() => {
        setChartData((prev) => {
          if (prev.length === 0) return prev;

          const updated = [...prev];
          const now = new Date();
          const newTimestamp = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

          // Remove oldest and add new
          updated.shift();
          updated.push({
            timestamp: newTimestamp,
            transactionCount: Math.floor(Math.random() * 30) + 5,
            fraudCount: Math.floor(Math.random() * 10) + 1,
            totalAmount: Math.random() * 80000 + 5000,
            avgFraudProbability: Math.random() * 0.4 + 0.2,
          });

          return updated;
        });
      }, 60000); // Every minute
    }

    return () => {
      if (chartUpdateIntervalRef.current) clearInterval(chartUpdateIntervalRef.current);
    };
  }, [selectedRange]);

  const unreadAlerts = store.alerts.filter((a) => !a.isRead).length;

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
              {store.signalRStatus === "Connected" ? (
                <>
                  <Wifi className="w-3 h-3 text-green-400" />
                  <span className="text-green-400 font-medium">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-red-400" />
                  <span className="text-red-400 font-medium">{store.signalRStatus}</span>
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
      {store.signalRStatus !== "Connected" && (
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
          <StatsBar stats={store.stats} isLoading={false} />
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
            <TransactionVolumeChart data={chartData} isLoading={isLoadingChartData} />

            {/* Two charts side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FraudProbabilityChart data={chartData} isLoading={isLoadingChartData} />
              <TransactionAmountChart data={chartData} isLoading={isLoadingChartData} />
            </div>

            {/* Geography Chart */}
            <GeographyBarChart transactions={store.transactions} isLoading={false} />
          </div>

          {/* Right Column - Decision Donut & Feed (30%) */}
          <div className="space-y-6">
            <FraudDecisionDonut transactions={store.transactions} isLoading={false} />
          </div>
        </div>

        {/* Live Transaction Feed */}
        <div className="mb-8">
          <div className="h-96">
            <LiveTransactionFeed transactions={store.transactions} isLoading={false} />
          </div>
        </div>
      </main>

      {/* Alerts Panel */}
      <AlertsPanel
        alerts={store.alerts}
        onMarkAsRead={(alertId) => store.markAlertAsRead(alertId)}
        onMarkAllAsRead={() => store.markAllAlertsAsRead()}
        isLoading={false}
      />

      {/* Connection Status Indicator */}
      <div className="fixed bottom-6 left-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800">
        <div
          className={`w-2 h-2 rounded-full ${
            store.signalRStatus === "Connected" ? "bg-green-500" : "bg-red-500"
          } ${store.signalRStatus === "Reconnecting" ? "animate-pulse" : ""}`}
        ></div>
        <span className="text-xs text-gray-400 font-medium">
          {store.signalRStatus}
        </span>
      </div>
    </div>
  );
}
