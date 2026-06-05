import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { ChartDataPoint } from "@/store/dashboardStore";

interface TransactionVolumeChartProps {
  data: ChartDataPoint[];
  isLoading?: boolean;
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const fraudRate = data.transactionCount > 0 ? ((data.fraudCount / data.transactionCount) * 100).toFixed(1) : 0;

  return (
    <div className="bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-2">{data.timestamp}</p>
      <p className="text-sm text-blue-400 font-semibold">
        Total: <span className="text-white">{data.transactionCount}</span>
      </p>
      <p className="text-sm text-red-400 font-semibold">
        Fraud: <span className="text-white">{data.fraudCount}</span>
      </p>
      <p className="text-sm text-yellow-400 font-semibold">
        Rate: <span className="text-white">{fraudRate}%</span>
      </p>
    </div>
  );
};

export const TransactionVolumeChart: React.FC<TransactionVolumeChartProps> = ({
  data,
  isLoading = false,
}) => {
  const avgTransactions = useMemo(() => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, d) => acc + d.transactionCount, 0);
    return Math.round(sum / data.length);
  }, [data]);

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

  if (data.length === 0) {
    return (
      <div className="w-full h-80 bg-slate-900/50 border border-slate-800 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 text-sm">No data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-80 bg-slate-900/50 border border-slate-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Transaction Volume</h3>
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="timestamp"
            stroke="#94a3b8"
            style={{ fontSize: "12px" }}
            tick={{ fill: "#cbd5e1" }}
          />
          <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} tick={{ fill: "#cbd5e1" }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "12px", color: "#cbd5e1" }}
            iconType="line"
          />
          <ReferenceLine
            y={avgTransactions}
            stroke="#8884d8"
            strokeDasharray="5 5"
            label={{ value: `Avg: ${avgTransactions}`, position: "insideTopRight", offset: -10, fill: "#8884d8" }}
          />
          <Area
            type="monotone"
            dataKey="transactionCount"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorTotal)"
            name="Total Transactions"
            animationDuration={300}
          />
          <Area
            type="monotone"
            dataKey="fraudCount"
            stroke="#ef4444"
            fillOpacity={1}
            fill="url(#colorFraud)"
            name="Fraud Attempts"
            animationDuration={300}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
