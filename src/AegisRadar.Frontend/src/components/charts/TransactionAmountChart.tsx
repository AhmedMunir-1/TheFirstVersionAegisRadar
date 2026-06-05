import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ChartDataPoint } from "@/store/dashboardStore";

interface TransactionAmountChartProps {
  data: ChartDataPoint[];
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

const CustomTooltip: React.FC<any> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-2">{data.timestamp}</p>
      <p className="text-sm text-green-400 font-semibold">
        Total Volume: <span className="text-white">{formatCurrency(data.totalAmount)}</span>
      </p>
      <p className="text-sm text-blue-400 font-semibold">
        Transactions: <span className="text-white">{data.transactionCount}</span>
      </p>
      {data.transactionCount > 0 && (
        <p className="text-sm text-gray-400">
          Avg: {formatCurrency(data.totalAmount / data.transactionCount)}
        </p>
      )}
    </div>
  );
};

export const TransactionAmountChart: React.FC<TransactionAmountChartProps> = ({
  data,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="w-full h-64 bg-slate-900/50 border border-slate-800 rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-slate-700 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Loading chart...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-64 bg-slate-900/50 border border-slate-800 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 text-sm">No data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64 bg-slate-900/50 border border-slate-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Transaction Amount</h3>
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="timestamp"
            stroke="#94a3b8"
            style={{ fontSize: "12px" }}
            tick={{ fill: "#cbd5e1" }}
          />
          <YAxis
            stroke="#94a3b8"
            style={{ fontSize: "12px" }}
            tick={{ fill: "#cbd5e1" }}
            tickFormatter={formatCurrency}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="totalAmount"
            stroke="#10b981"
            fillOpacity={1}
            fill="url(#colorAmount)"
            name="Transaction Volume"
            animationDuration={300}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
