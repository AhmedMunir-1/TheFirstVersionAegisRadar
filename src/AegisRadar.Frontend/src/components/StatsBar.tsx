import React, { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { DashboardStats } from "@/store/dashboardStore";

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  change?: number;
  isAlert?: boolean;
  sparkline?: number[];
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  change,
  isAlert = false,
  sparkline = [],
}) => {
  const isNegative = change !== undefined && change < 0;

  return (
    <div
      className={`px-4 py-3 rounded border transition-all ${
        isAlert
          ? "bg-red-500/10 border-red-500/30 hover:border-red-500/50"
          : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {label}
        </label>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold ${
              isNegative ? "text-red-400" : "text-green-400"
            }`}
          >
            {isNegative ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <TrendingUp className="w-3 h-3" />
            )}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>
      {sparkline && sparkline.length > 0 && (
        <div className="mt-3 flex items-end gap-0.5 h-8">
          {sparkline.map((v, i) => {
            const maxVal = Math.max(...sparkline);
            const height = maxVal > 0 ? (v / maxVal) * 100 : 10;
            return (
              <div
                key={i}
                className="flex-1 bg-blue-600 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
                style={{ height: `${height}%` }}
                title={v.toString()}
              ></div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface StatsBarProps {
  stats: DashboardStats;
  isLoading?: boolean;
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
};

export const StatsBar: React.FC<StatsBarProps> = ({ stats, isLoading = false }) => {
  // Guard against undefined stats or missing properties
  if (!stats) {
    return (
      <div className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-center h-24">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-slate-700 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500">Loading stats...</p>
          </div>
        </div>
      </div>
    );
  }

  const fraudRateThreshold = (stats.fraudRateToday ?? 0) > 5;
  const processingTimeThreshold = (stats.avgProcessingTimeMs ?? 0) > 500;

  const mockSparkline = useMemo(() => {
    return Array.from({ length: 10 }, () => Math.floor(Math.random() * 100));
  }, []);

  if (isLoading) {
    return (
      <div className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-center h-24">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-slate-700 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500">Loading stats...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          label="Total Transactions"
          value={stats.totalTransactionsToday ?? 0}
          sparkline={mockSparkline}
        />
        <StatCard
          label="Total Amount"
          value={formatCurrency(stats.totalAmountToday ?? 0)}
          sparkline={mockSparkline}
        />
        <StatCard
          label="Fraud Rate"
          value={(stats.fraudRateToday ?? 0).toFixed(1)}
          unit="%"
          isAlert={fraudRateThreshold}
          sparkline={mockSparkline}
        />
        <StatCard
          label="Blocked"
          value={stats.blockedCount ?? 0}
          change={5}
        />
        <StatCard
          label="Pending Review"
          value={stats.pendingReviewCount ?? 0}
          change={-2}
        />
        <StatCard
          label="Avg Processing"
          value={stats.avgProcessingTimeMs ?? 0}
          unit="ms"
          isAlert={processingTimeThreshold}
          sparkline={mockSparkline}
        />
      </div>
    </div>
  );
};
