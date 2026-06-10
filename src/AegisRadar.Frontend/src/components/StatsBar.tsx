import React, { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { DashboardStatsDto } from "@/types/api";

// ─── Animated counter hook ────────────────────────────────────────────────────
function useAnimatedNumber(target: number, duration = 600): number {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = prevRef.current;
    if (from === target) return;

    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        prevRef.current = target;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return display;
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number;
  formatter?: (v: number) => string;
  unit?: string;
  change?: number;
  isAlert?: boolean;
  sparkline?: number[];
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  formatter,
  unit,
  change,
  isAlert = false,
  sparkline = [],
}) => {
  const animated = useAnimatedNumber(value);
  const displayValue = formatter ? formatter(animated) : animated.toString();
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
        <div className="text-2xl font-bold text-white tabular-nums transition-all">
          {displayValue}
        </div>
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
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── StatsBar ─────────────────────────────────────────────────────────────────
interface StatsBarProps {
  stats: DashboardStatsDto;
  unreadAlerts?: number;
  avgFraudProbability?: number;
  isLoading?: boolean;
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
};

// Multiply by 10 before passing to the animated counter so it handles decimals
// (counter only works with integers), then divide back in the formatter.
const formatPercent = (v: number) => `${(v / 10).toFixed(1)}`;

export const StatsBar: React.FC<StatsBarProps> = ({
  stats,
  unreadAlerts = 0,
  avgFraudProbability = 0,
  isLoading = false,
}) => {
  if (!stats || isLoading) {
    return (
      <div className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-center h-24">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-slate-700 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading stats...</p>
          </div>
        </div>
      </div>
    );
  }

  const fraudRateToday = stats.fraudRateToday ?? 0;
  const avgFraudPct = (avgFraudProbability ?? 0) * 100;
  const fraudRateThreshold = fraudRateToday > 5;

  return (
    <div className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          label="Total Transactions"
          value={stats.totalTransactionsToday ?? 0}
        />
        <StatCard
          label="Total Amount"
          value={Math.round(stats.totalAmountToday ?? 0)}
          formatter={formatCurrency}
        />
        {/* Fraud Rate: pass value * 10 so the integer counter can animate decimals */}
        <StatCard
          label="Fraud Rate"
          value={Math.round(fraudRateToday * 10)}
          formatter={formatPercent}
          unit="%"
          isAlert={fraudRateThreshold}
        />
        <StatCard
          label="Blocked"
          value={stats.blockedCount ?? 0}
          change={5}
        />
        <StatCard
          label="Unread Alerts"
          value={unreadAlerts}
          change={-2}
        />
        <StatCard
          label="Avg Fraud %"
          value={Math.round(avgFraudPct * 10)}
          formatter={formatPercent}
          unit="%"
          isAlert={avgFraudPct > 50}
        />
      </div>
    </div>
  );
};
