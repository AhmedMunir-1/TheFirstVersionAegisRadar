import React, { useMemo } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ChartDataPoint } from "@/store/dashboardStore";

interface FraudProbabilityChartProps {
  data: ChartDataPoint[];
  isLoading?: boolean;
}

const getBarColor = (avgFraud: number): string => {
  if (avgFraud < 0.3) return "#10b981"; // green
  if (avgFraud < 0.6) return "#f59e0b"; // yellow
  return "#ef4444"; // red
};

const CustomTooltip: React.FC<any> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const fraudPct = (data.avgFraudProbability * 100).toFixed(1);

  return (
    <div className="bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-2">{data.timestamp}</p>
      <p className="text-sm text-blue-400 font-semibold">
        Volume: <span className="text-white">{data.transactionCount}</span>
      </p>
      <p className="text-sm text-purple-400 font-semibold">
        Avg Fraud: <span className="text-white">{fraudPct}%</span>
      </p>
    </div>
  );
};

export const FraudProbabilityChart: React.FC<FraudProbabilityChartProps> = ({
  data,
  isLoading = false,
}) => {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        barColor: getBarColor(d.avgFraudProbability),
      })),
    [data]
  );

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
      <h3 className="text-lg font-semibold text-white mb-4">Fraud Probability Trend</h3>
      <ResponsiveContainer width="100%" height="90%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="timestamp"
            stroke="#94a3b8"
            style={{ fontSize: "12px" }}
            tick={{ fill: "#cbd5e1" }}
          />
          <YAxis
            yAxisId="left"
            stroke="#94a3b8"
            style={{ fontSize: "12px" }}
            tick={{ fill: "#cbd5e1" }}
            label={{ value: "Transaction Count", angle: -90, position: "insideLeft" }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#94a3b8"
            style={{ fontSize: "12px" }}
            tick={{ fill: "#cbd5e1" }}
            domain={[0, 1]}
            label={{ value: "Avg Fraud Probability", angle: 90, position: "insideRight" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: "12px", color: "#cbd5e1" }} />
          <Bar
            yAxisId="left"
            dataKey="transactionCount"
            fill="#3b82f6"
            name="Transaction Count"
            radius={[4, 4, 0, 0]}
            animationDuration={300}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="avgFraudProbability"
            stroke="#8b5cf6"
            strokeWidth={2}
            name="Avg Fraud Probability"
            dot={false}
            animationDuration={300}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
