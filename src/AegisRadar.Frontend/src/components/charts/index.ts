import React from "react";
import { TransactionVolumeChart as _TransactionVolumeChart } from "./TransactionVolumeChart";
import { FraudProbabilityChart as _FraudProbabilityChart } from "./FraudProbabilityChart";
import { TransactionAmountChart as _TransactionAmountChart } from "./TransactionAmountChart";
import { FraudDecisionDonut as _FraudDecisionDonut } from "./FraudDecisionDonut";
import { GeographyBarChart as _GeographyBarChart } from "./GeographyBarChart";
import type { ChartDataPoint } from "@/store/dashboardStore";

// Memoize all chart components to prevent unnecessary re-renders
export const TransactionVolumeChart = React.memo(_TransactionVolumeChart, (prev, next) => {
  // Custom comparison: only re-render if data actually changed
  return (
    prev.data === next.data &&
    prev.isLoading === next.isLoading
  );
});
TransactionVolumeChart.displayName = "TransactionVolumeChart";

export const FraudProbabilityChart = React.memo(_FraudProbabilityChart, (prev, next) => {
  return (
    prev.data === next.data &&
    prev.isLoading === next.isLoading
  );
});
FraudProbabilityChart.displayName = "FraudProbabilityChart";

export const TransactionAmountChart = React.memo(_TransactionAmountChart, (prev, next) => {
  return (
    prev.data === next.data &&
    prev.isLoading === next.isLoading
  );
});
TransactionAmountChart.displayName = "TransactionAmountChart";

export const FraudDecisionDonut = React.memo(_FraudDecisionDonut, (prev, next) => {
  return prev.isLoading === next.isLoading;
});
FraudDecisionDonut.displayName = "FraudDecisionDonut";

export const GeographyBarChart = React.memo(_GeographyBarChart, (prev, next) => {
  return prev.isLoading === next.isLoading;
});
GeographyBarChart.displayName = "GeographyBarChart";
