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
  AlertDto,
  MerchantProfileDto,
  SubscriptionPlanDto,
  CreatePaymentDto,
  ProcessPaymentDto,
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

// Export everything as apiClient
export const apiClient = {
  auth,
  dashboard,
  transactions,
  alerts,
  merchants,
  subscriptions,
  payments,
  instance: axiosInstance,
};

export default apiClient;
