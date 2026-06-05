import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { Transaction } from "@/services/signalRService";

interface GeographyBarChartProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

const getGradientColor = (fraudRate: number): string => {
  if (fraudRate < 0.2) return "#10b981"; // green
  if (fraudRate < 0.4) return "#84cc16"; // lime
  if (fraudRate < 0.6) return "#f59e0b"; // yellow
  return "#ef4444"; // red
};

const CustomTooltip: React.FC<any> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const fraudRate = ((data.fraudCount / data.transactionCount) * 100).toFixed(1);

  return (
    <div className="bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-sm font-semibold text-white mb-2">{data.country}</p>
      <p className="text-sm text-blue-400">
        Transactions: <span className="text-white">{data.transactionCount}</span>
      </p>
      <p className="text-sm text-red-400">
        Fraud: <span className="text-white">{data.fraudCount}</span>
      </p>
      <p className="text-sm text-yellow-400">
        Rate: <span className="text-white">{fraudRate}%</span>
      </p>
    </div>
  );
};

export const GeographyBarChart: React.FC<GeographyBarChartProps> = ({
  transactions,
  isLoading = false,
}) => {
  const countryData = useMemo(() => {
    const countryMap: {
      [key: string]: { transactionCount: number; fraudCount: number };
    } = {};

    transactions.forEach((t) => {
      if (!countryMap[t.country]) {
        countryMap[t.country] = { transactionCount: 0, fraudCount: 0 };
      }
      countryMap[t.country].transactionCount += 1;
      if (t.fraudProbability > 0.5) {
        countryMap[t.country].fraudCount += 1;
      }
    });

    return Object.entries(countryMap)
      .map(([country, data]) => ({
        country,
        ...data,
        fraudRate: data.transactionCount > 0 ? data.fraudCount / data.transactionCount : 0,
      }))
      .sort((a, b) => b.transactionCount - a.transactionCount)
      .slice(0, 10);
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

  if (countryData.length === 0) {
    return (
      <div className="w-full h-80 bg-slate-900/50 border border-slate-800 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 text-sm">No data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-80 bg-slate-900/50 border border-slate-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Top 10 Countries by Volume</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={countryData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis type="number" stroke="#94a3b8" style={{ fontSize: "12px" }} tick={{ fill: "#cbd5e1" }} />
          <YAxis
            dataKey="country"
            type="category"
            stroke="#94a3b8"
            style={{ fontSize: "12px" }}
            tick={{ fill: "#cbd5e1" }}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="transactionCount"
            fill="#3b82f6"
            name="Transactions"
            radius={[0, 4, 4, 0]}
            animationDuration={300}
          >
            {countryData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getGradientColor(entry.fraudRate)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
