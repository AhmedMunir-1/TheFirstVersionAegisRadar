import axios, { AxiosInstance, AxiosError } from "axios";
import {
  ApiResponse,
  ApiError,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  DashboardStatsDto,
  FraudTrendDto,
  TransactionResponseDto,
  CreateTransactionRequest,
  ReviewDecisionDto,
  AlertDto,
  MerchantProfileDto,
  SubscriptionPlanDto,
  CreatePaymentDto,
  ProcessPaymentDto,
  AnalyticsSummaryDto,
  PostureSummaryDto,
  HistoryResponseDto,
  TeamMemberDto,
  InviteTeamMemberDto,
  UpdateRoleDto,
  UpdateRoleResponseDto,
  SettingsDto,
  UpdateSettingsRequestDto,
  UpdateSettingsResponseDto,
  MerchantApiKeyDto,
  CreateApiKeyRequestDto,
  CreateApiKeyResponseDto,
  AppNotificationDto,
  DemoStatusDto,
  BatchTestResponseDto,
} from "@/types/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5099";
const TOKEN_KEY = "aegis_token";

// Create axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: inject authorization token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle errors and unwrap data
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = "/login";
    }

    const data = error.response?.data;
    const message = data?.message || error.message || "An error occurred";
    const errors = data?.errors || [];

    throw new ApiError(
      error.response?.status || 500,
      message,
      errors
    );
  }
);

// ==================== AUTH CLIENT ====================
export const auth = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await axiosInstance.post<ApiResponse<LoginResponse>>(
      "/api/auth/login",
      { email, password } as LoginRequest
    );
    const token = response.data.data.token;
    localStorage.setItem(TOKEN_KEY, token);
    return response.data.data;
  },

  async register(dto: RegisterRequest): Promise<RegisterResponse> {
    const response = await axiosInstance.post<ApiResponse<RegisterResponse>>(
      "/api/auth/register",
      dto
    );
    return response.data.data;
  },

  async verify(email: string, code: string): Promise<LoginResponse> {
    const response = await axiosInstance.post<ApiResponse<LoginResponse>>(
      "/api/auth/verify",
      { email, code } as VerifyRequest
    );
    const token = response.data.data.token;
    localStorage.setItem(TOKEN_KEY, token);
    return response.data.data;
  },

  async forgotPassword(email: string): Promise<void> {
    await axiosInstance.post("/api/auth/forgot-password", {
      email,
    } as ForgotPasswordRequest);
  },

  async resetPassword(
    email: string,
    code: string,
    newPassword: string
  ): Promise<void> {
    await axiosInstance.post("/api/auth/reset-password", {
      email,
      code,
      newPassword,
    } as ResetPasswordRequest);
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};

// ==================== DASHBOARD CLIENT ====================
export const dashboard = {
  async getStats(): Promise<DashboardStatsDto> {
    const response = await axiosInstance.get<ApiResponse<DashboardStatsDto>>(
      "/api/dashboard/stats"
    );
    return response.data.data;
  },

  async getTrends(days: number = 7): Promise<FraudTrendDto[]> {
    const response = await axiosInstance.get<ApiResponse<FraudTrendDto[]>>(
      `/api/dashboard/trends?days=${days}`
    );
    return response.data.data;
  },

  async getRecent(count: number = 10): Promise<TransactionResponseDto[]> {
    const response = await axiosInstance.get<ApiResponse<TransactionResponseDto[]>>(
      `/api/dashboard/recent?count=${count}`
    );
    return response.data.data;
  },
};

// ==================== TRANSACTIONS CLIENT ====================
export const transactions = {
  async getAll(
    page: number = 1,
    pageSize: number = 20
  ): Promise<TransactionResponseDto[]> {
    const response = await axiosInstance.get<ApiResponse<TransactionResponseDto[]>>(
      `/api/transactions?page=${page}&pageSize=${pageSize}`
    );
    return response.data.data;
  },

  async getById(id: string): Promise<TransactionResponseDto> {
    const response = await axiosInstance.get<ApiResponse<TransactionResponseDto>>(
      `/api/transactions/${id}`
    );
    return response.data.data;
  },

  async create(dto: CreateTransactionRequest): Promise<TransactionResponseDto> {
    const response = await axiosInstance.post<ApiResponse<TransactionResponseDto>>(
      "/api/transactions",
      dto
    );
    return response.data.data;
  },

  async review(id: string, decision: ReviewDecisionDto): Promise<TransactionResponseDto> {
    const response = await axiosInstance.patch<ApiResponse<TransactionResponseDto>>(
      `/api/transactions/${id}/review`,
      decision
    );
    return response.data.data;
  },

  async manualDecision(
    id: string,
    decision: "Approved" | "Blocked",
    reason: string
  ): Promise<TransactionResponseDto> {
    const response = await axiosInstance.patch<ApiResponse<TransactionResponseDto>>(
      `/api/transactions/${id}/decision`,
      { decision, reason }
    );
    return response.data.data;
  },

  async generateDemo(count: number = 10): Promise<{ generated: number }> {
    const response = await axiosInstance.post<ApiResponse<{ generated: number }>>(
      `/api/transactions/generate-demo?count=${count}`
    );
    return response.data.data;
  },
};

// ==================== ALERTS CLIENT ====================
export const alerts = {
  async getAll(unreadOnly: boolean = false): Promise<AlertDto[]> {
    const response = await axiosInstance.get<ApiResponse<AlertDto[]>>(
      `/api/alerts?unreadOnly=${unreadOnly}`
    );
    return response.data.data;
  },

  async markRead(id: string): Promise<void> {
    await axiosInstance.put(`/api/alerts/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await axiosInstance.put("/api/alerts/read-all");
  },
};

// ==================== MERCHANTS CLIENT ====================
export const merchants = {
  async getMe(): Promise<MerchantProfileDto> {
    const response = await axiosInstance.get<ApiResponse<MerchantProfileDto>>(
      "/api/merchants/me"
    );
    return response.data.data;
  },
};

// ==================== SUBSCRIPTIONS CLIENT ====================
export const subscriptions = {
  async getPlans(): Promise<SubscriptionPlanDto[]> {
    const response = await axiosInstance.get<ApiResponse<SubscriptionPlanDto[]>>(
      "/api/subscriptions/plans"
    );
    return response.data.data;
  },
};

// ==================== PAYMENTS CLIENT ====================
export const payments = {
  async initiate(dto: CreatePaymentDto): Promise<{ paymentId: string }> {
    const response = await axiosInstance.post<ApiResponse<{ paymentId: string }>>(
      "/api/payments/initiate",
      dto
    );
    return response.data.data;
  },

  async process(dto: ProcessPaymentDto): Promise<{ success: boolean }> {
    const response = await axiosInstance.post<ApiResponse<{ success: boolean }>>(
      "/api/payments/process",
      dto
    );
    return response.data.data;
  },
};

// ==================== ANALYTICS CLIENT ====================
export const analytics = {
  async getSummary(): Promise<AnalyticsSummaryDto> {
    const response = await axiosInstance.get<ApiResponse<AnalyticsSummaryDto>>(
      "/api/analytics"
    );
    return response.data.data;
  },
};

// ==================== POSTURE CLIENT ====================
export const posture = {
  async getSummary(): Promise<PostureSummaryDto> {
    const response = await axiosInstance.get<ApiResponse<PostureSummaryDto>>(
      "/api/posture"
    );
    return response.data.data;
  },
};

// ==================== HISTORY CLIENT ====================
export const history = {
  async getTransactions(
    limit: number = 500,
    offset: number = 0,
    status?: string,
    riskMin?: number
  ): Promise<HistoryResponseDto> {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());
    if (status) params.append("status", status);
    if (riskMin !== undefined && riskMin > 0) params.append("riskMin", riskMin.toString());

    const response = await axiosInstance.get<ApiResponse<HistoryResponseDto>>(
      `/api/history?${params.toString()}`
    );
    return response.data.data;
  },
};

// ==================== TEAM CLIENT ====================
export const team = {
  async getMembers(): Promise<TeamMemberDto[]> {
    const response = await axiosInstance.get<ApiResponse<TeamMemberDto[]>>(
      "/api/team"
    );
    return response.data.data;
  },

  async inviteMember(dto: InviteTeamMemberDto): Promise<TeamMemberDto> {
    const response = await axiosInstance.post<ApiResponse<TeamMemberDto>>(
      "/api/team/invite",
      dto
    );
    return response.data.data;
  },

  async updateMemberRole(
    memberId: string,
    dto: UpdateRoleDto
  ): Promise<UpdateRoleResponseDto> {
    const response = await axiosInstance.put<ApiResponse<UpdateRoleResponseDto>>(
      `/api/team/${memberId}/role`,
      dto
    );
    return response.data.data;
  },
};

// ==================== SETTINGS CLIENT ====================
export const settings = {
  async getSettings(): Promise<SettingsDto> {
    const response = await axiosInstance.get<ApiResponse<SettingsDto>>(
      "/api/settings"
    );
    return response.data.data;
  },

  async updateSettings(
    dto: UpdateSettingsRequestDto
  ): Promise<UpdateSettingsResponseDto> {
    const response = await axiosInstance.put<ApiResponse<UpdateSettingsResponseDto>>(
      "/api/settings",
      dto
    );
    return response.data.data;
  },
};

// ==================== API KEYS CLIENT ====================
export const apiKeys = {
  async getKeys(): Promise<MerchantApiKeyDto[]> {
    const response = await axiosInstance.get<ApiResponse<MerchantApiKeyDto[]>>(
      "/api/api-keys"
    );
    return response.data.data;
  },

  async createKey(dto: CreateApiKeyRequestDto): Promise<CreateApiKeyResponseDto> {
    const response = await axiosInstance.post<ApiResponse<CreateApiKeyResponseDto>>(
      "/api/api-keys",
      dto
    );
    return response.data.data;
  },

  async deleteKey(id: string): Promise<void> {
    await axiosInstance.delete(`/api/api-keys/${id}`);
  },
};

// ==================== IN-APP NOTIFICATIONS CLIENT ====================
export const inAppNotifications = {
  async getNotifications(limit: number = 50): Promise<AppNotificationDto[]> {
    const response = await axiosInstance.get<ApiResponse<AppNotificationDto[]>>(
      `/api/in-app-notifications?limit=${limit}`
    );
    return response.data.data;
  },

  async markAsRead(id: string): Promise<void> {
    await axiosInstance.post(`/api/in-app-notifications/${id}/read`);
  },
};

// ==================== DEMO CLIENT ====================
export const demo = {
  async getStatus(): Promise<DemoStatusDto> {
    const response = await axiosInstance.get<ApiResponse<DemoStatusDto>>(
      "/api/demo/status"
    );
    return response.data.data;
  },

  async batchTest(
    count: number = 30,
    type?: string
  ): Promise<BatchTestResponseDto> {
    const params = new URLSearchParams();
    params.append("count", count.toString());
    if (type) params.append("type", type);

    const response = await axiosInstance.get<ApiResponse<BatchTestResponseDto>>(
      `/api/demo/batch-test?${params.toString()}`
    );
    return response.data.data;
  },
};

// Export everything as apiClient
export const apiClient = {
  auth,
  dashboard,
  transactions,
  alerts,
  merchants,
  subscriptions,
  payments,
  analytics,
  posture,
  history,
  team,
  settings,
  apiKeys,
  inAppNotifications,
  demo,
  instance: axiosInstance,
};

export default apiClient;
