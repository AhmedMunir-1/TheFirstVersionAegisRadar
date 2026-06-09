import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { useDashboardStore } from "@/store/dashboardStore";

// Props kept for backwards-compat with index.ts which wraps this
interface GeographyBarChartProps {
  transactions?: any[];
  isLoading?: boolean;
}

const CustomTooltip: React.FC<any> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-sm font-semibold text-white mb-1">{data.name}</p>
      <p className="text-sm text-gray-400">
        Count: <span className="text-white font-semibold">{data.value}</span>
      </p>
    </div>
  );
};

export const GeographyBarChart: React.FC<GeographyBarChartProps> = () => {
  const stats = useDashboardStore((state) => state.stats);

  const barData = stats
    ? [
        {
          name: "Approved",
          value: Math.max(
            0,
            (stats.totalTransactionsToday ?? 0) - (stats.blockedCount ?? 0) - (stats.pendingReviewCount ?? 0)
          ),
          fill: "#10b981",
        },
        { name: "Review",   value: stats.pendingReviewCount ?? 0, fill: "#f59e0b" },
        { name: "Blocked",  value: stats.blockedCount ?? 0,       fill: "#ef4444" },
        { name: "Total",    value: stats.totalTransactionsToday ?? 0, fill: "#3b82f6" },
      ]
    : [];

  if (!stats) {
    return (
      <div className="w-full h-80 bg-slate-900/50 border border-slate-800 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 text-sm">No data</p>
      </div>
    );
  }

  return (
    <div className="w-full h-80 bg-slate-900/50 border border-slate-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Decision Overview</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={barData}
          margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#94a3b8"
            style={{ fontSize: "12px" }}
            tick={{ fill: "#cbd5e1" }}
          />
          <YAxis
            stroke="#94a3b8"
            style={{ fontSize: "12px" }}
            tick={{ fill: "#cbd5e1" }}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
            animationDuration={400}
          >
            <LabelList
              dataKey="value"
              position="top"
              style={{ fill: "#e2e8f0", fontSize: "12px", fontWeight: 600 }}
            />
            {barData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
