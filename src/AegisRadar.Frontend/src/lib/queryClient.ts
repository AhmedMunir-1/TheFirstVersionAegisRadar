import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/apiClient";
import type {
  DashboardStatsDto,
  FraudTrendDto,
  TransactionResponseDto,
  AlertDto,
  MerchantProfileDto,
  SubscriptionPlanDto,
} from "@/types/api";

// Query keys
export const queryKeys = {
  dashboard: {
    stats: () => ["dashboard", "stats"],
    trends: (days: number) => ["dashboard", "trends", days],
    recent: (count: number) => ["dashboard", "recent", count],
  },
  transactions: {
    all: (page: number, pageSize: number) => ["transactions", page, pageSize],
    detail: (id: string) => ["transactions", id],
  },
  alerts: {
    all: (unreadOnly: boolean) => ["alerts", unreadOnly],
  },
  merchants: {
    profile: () => ["merchants", "profile"],
  },
  subscriptions: {
    plans: () => ["subscriptions", "plans"],
  },
};

// ==================== DASHBOARD QUERIES ====================

export function useDashboardStats() {
  return useQuery<DashboardStatsDto>({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => apiClient.dashboard.getStats(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every 60 seconds
    refetchOnWindowFocus: true,
  });
}

export function useFraudTrends(days: number = 7) {
  return useQuery<FraudTrendDto[]>({
    queryKey: queryKeys.dashboard.trends(days),
    queryFn: () => apiClient.dashboard.getTrends(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: days > 0,
  });
}

export function useRecentTransactions(count: number = 50) {
  return useQuery<TransactionResponseDto[]>({
    queryKey: queryKeys.dashboard.recent(count),
    queryFn: () => apiClient.dashboard.getRecent(count),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ==================== TRANSACTIONS QUERIES ====================

export function useTransactions(page: number = 1, pageSize: number = 20) {
  return useQuery<TransactionResponseDto[]>({
    queryKey: queryKeys.transactions.all(page, pageSize),
    queryFn: () => apiClient.transactions.getAll(page, pageSize),
    staleTime: 30 * 1000, // 30 seconds
    enabled: page > 0 && pageSize > 0,
  });
}

export function useTransactionDetail(id: string) {
  return useQuery<TransactionResponseDto>({
    queryKey: queryKeys.transactions.detail(id),
    queryFn: () => apiClient.transactions.getById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id,
  });
}

// ==================== ALERTS QUERIES ====================

export function useAlerts(unreadOnly: boolean = false) {
  return useQuery<AlertDto[]>({
    queryKey: queryKeys.alerts.all(unreadOnly),
    queryFn: () => apiClient.alerts.getAll(unreadOnly),
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

// ==================== MERCHANTS QUERIES ====================

export function useMerchantProfile() {
  return useQuery<MerchantProfileDto>({
    queryKey: queryKeys.merchants.profile(),
    queryFn: () => apiClient.merchants.getMe(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ==================== SUBSCRIPTIONS QUERIES ====================

export function useSubscriptionPlans() {
  return useQuery<SubscriptionPlanDto[]>({
    queryKey: queryKeys.subscriptions.plans(),
    queryFn: () => apiClient.subscriptions.getPlans(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

// ==================== MUTATIONS ====================

export function useMarkAlertRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.alerts.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all(false) });
    },
  });
}

export function useMarkAllAlertsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.alerts.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all(false) });
    },
  });
}
