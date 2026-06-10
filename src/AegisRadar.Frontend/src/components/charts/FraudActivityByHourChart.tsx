import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { TransactionResponseDto } from "@/types/api";

interface FraudActivityByHourChartProps {
  transactions: TransactionResponseDto[];
  isLoading?: boolean;
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-2">Hour: {label}:00</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: <span className="text-white">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

export const FraudActivityByHourChart: React.FC<FraudActivityByHourChartProps> = ({
  transactions,
  isLoading = false,
}) => {
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      ApprovedCount: 0,
      BlockedCount: 0,
    }));

    transactions.forEach((tx) => {
      let hour = tx.prediction?.hour;
      if (hour === undefined || hour === null) {
        hour = new Date(tx.createdAt).getHours();
      }
      
      if (hour >= 0 && hour < 24) {
        if (tx.status === "Blocked") {
          hours[hour].BlockedCount += 1;
        } else if (tx.status === "Approved") {
          hours[hour].ApprovedCount += 1;
        }
      }
    });

    return hours;
  }, [transactions]);

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

  if (transactions.length === 0) {
    return (
      <div className="w-full h-80 bg-slate-900/50 border border-slate-800 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 text-sm">No data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-80 bg-slate-900/50 border border-slate-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Fraud Activity by Hour</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="hour"
            stroke="#94a3b8"
            style={{ fontSize: "12px" }}
            tick={{ fill: "#cbd5e1" }}
            tickFormatter={(value) => `${value}:00`}
          />
          <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} tick={{ fill: "#cbd5e1" }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#334155", opacity: 0.4 }} />
          <Legend wrapperStyle={{ fontSize: "12px", color: "#cbd5e1" }} />
          <Bar dataKey="BlockedCount" name="Blocked" fill="#ef4444" stackId="a" animationDuration={300} />
          <Bar dataKey="ApprovedCount" name="Approved" fill="#10b981" stackId="a" animationDuration={300} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
