import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TransactionResponseDto } from "@/types/api";

interface HighRiskTransactionsChartProps {
  transactions: TransactionResponseDto[];
  isLoading?: boolean;
}

const CustomTooltip: React.FC<any> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-2">{data.date}</p>
      <p className="text-sm text-red-400 font-semibold">
        High Risk Count: <span className="text-white">{data.HighRiskCount}</span>
      </p>
    </div>
  );
};

export const HighRiskTransactionsChart: React.FC<HighRiskTransactionsChartProps> = ({
  transactions,
  isLoading = false,
}) => {
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const dayMap = new Map<string, number>();

    // transactions are sorted newest first. Let's process oldest first to keep chronological order
    const sortedTxs = [...transactions].reverse();

    sortedTxs.forEach((tx) => {
      const prob = tx.prediction?.fraudProbability ?? 0;
      if (prob >= 0.8) {
        const dateObj = new Date(tx.createdAt);
        const dateStr = dateObj.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const currentCount = dayMap.get(dateStr) || 0;
        dayMap.set(dateStr, currentCount + 1);
      }
    });

    const data = Array.from(dayMap.entries()).map(([date, HighRiskCount]) => ({
      date,
      HighRiskCount,
    }));

    return data;
  }, [transactions]);

  if (isLoading) {
    return (
      <div className="w-full h-64 bg-slate-900/50 border border-slate-800 rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-slate-700 border-t-red-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Loading chart...</p>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="w-full h-64 bg-slate-900/50 border border-slate-800 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 text-sm">No high risk transactions</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64 bg-slate-900/50 border border-slate-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">High Risk Transactions Trend</h3>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            style={{ fontSize: "12px" }}
            tick={{ fill: "#cbd5e1" }}
          />
          <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} tick={{ fill: "#cbd5e1" }} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="HighRiskCount"
            stroke="#ef4444"
            strokeWidth={3}
            name="High Risk Count"
            dot={{ r: 4, fill: "#ef4444", strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "#f87171" }}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
