import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TimeRange = "1H" | "6H" | "24H" | "7D" | "30D" | "1Y" | "5Y";

interface TimeRangeSelectorProps {
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  isLoading?: boolean;
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  selectedRange,
  onRangeChange,
  isLoading = false,
}) => {
  const ranges: TimeRange[] = ["1H", "6H", "24H", "7D", "30D", "1Y", "5Y"];

  return (
    <div className="flex gap-2 items-center">
      <span className="text-sm text-gray-400">Time Range:</span>
      <div className="flex gap-1 bg-slate-900/50 rounded-lg p-1 border border-slate-800">
        {ranges.map((range) => (
          <Button
            key={range}
            variant={selectedRange === range ? "default" : "ghost"}
            size="sm"
            onClick={() => onRangeChange(range)}
            disabled={isLoading}
            className={cn(
              "text-xs font-medium transition-all",
              selectedRange === range
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                : "text-gray-400 hover:text-gray-200 hover:bg-slate-800"
            )}
          >
            {range}
          </Button>
        ))}
      </div>
      {isLoading && (
        <div className="flex items-center gap-2 ml-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500">Loading data...</span>
        </div>
      )}
    </div>
  );
};
