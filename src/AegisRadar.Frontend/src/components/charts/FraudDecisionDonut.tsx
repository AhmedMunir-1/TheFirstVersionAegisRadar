import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TransactionResponseDto } from "@/types/api";
import { useDashboardStore } from "@/store/dashboardStore";

interface FraudDecisionDonutProps {
  transactions: TransactionResponseDto[];
  isLoading?: boolean;
}

const COLORS = {
  Approved: "#10b981", // green
  Blocked: "#ef4444",  // red
  Review: "#f59e0b",   // yellow
  Pending: "#6b7280",  // gray
};

const CustomTooltip: React.FC<any> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0];

  return (
    <div className="bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-sm font-semibold text-white">{data.name}</p>
      <p className="text-sm text-gray-400">
        Count: <span className="text-white font-semibold">{data.value}</span>
      </p>
      <p className="text-sm text-gray-400">
        Percentage: <span className="text-white font-semibold">{data.payload.percentage.toFixed(1)}%</span>
      </p>
    </div>
  );
};

export const FraudDecisionDonut: React.FC<FraudDecisionDonutProps> = ({
  transactions,
  isLoading = false,
}) => {
  // Read counts directly from stats for accuracy (transactions array may be partial)
  const stats = useDashboardStore((state) => state.stats);

  const donutData = useMemo(() => {
    if (!stats) return [];
    const total = stats.totalTransactionsToday || 1;
    const approved = Math.max(0,
      (stats.totalTransactionsToday ?? 0) -
      (stats.blockedCount ?? 0) -
      (stats.pendingReviewCount ?? 0)
    );
    return [
      {
        name: "Approved",
        value: approved,
        percentage: (approved / total) * 100,
      },
      {
        name: "Blocked",
        value: stats.blockedCount ?? 0,
        percentage: ((stats.blockedCount ?? 0) / total) * 100,
      },
      {
        name: "Review",
        value: stats.pendingReviewCount ?? 0,
        percentage: ((stats.pendingReviewCount ?? 0) / total) * 100,
      },
    ].filter((d) => d.value > 0);
  }, [stats]);

  if (isLoading) {
    return (
      <div className="w-full h-80 bg-slate-900/50 border border-slate-800 rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-slate-700 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Loading chart...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="w-full h-80 bg-slate-900/50 border border-slate-800 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 text-sm">No data available</p>
      </div>
    );
  }

  const total = stats.totalTransactionsToday ?? 0;

  return (
    <div className="w-full h-80 bg-slate-900/50 border border-slate-800 rounded-lg p-4 flex flex-col">
      <h3 className="text-lg font-semibold text-white mb-4">Transaction Status</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={donutData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            animationDuration={300}
          >
            {donutData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[entry.name as keyof typeof COLORS]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              fontSize: "12px",
              color: "#cbd5e1",
              paddingTop: "20px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 pt-4 border-t border-slate-700 text-center">
        <p className="text-2xl font-bold text-white">{total}</p>
        <p className="text-sm text-gray-400">Total Transactions</p>
      </div>
    </div>
  );
};
