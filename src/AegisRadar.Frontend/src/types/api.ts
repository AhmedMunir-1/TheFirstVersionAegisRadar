// ==================== AUTH DTOs ====================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  merchantId: string;
  email: string;
  companyName: string;
  isTrialActive: boolean;
  trialEndDate?: string;
}

export interface RegisterRequest {
  companyName: string;
  email: string;
  password: string;
  country: string;
}

export interface RegisterResponse {
  merchantId: string;
  email: string;
  requiresVerification: boolean;
}

export interface VerifyRequest {
  email: string;
  code: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

// ==================== DASHBOARD DTOs ====================
export interface DashboardStatsDto {
  totalTransactionsToday: number;
  totalAmountToday: number;
  fraudRateToday: number;
  blockedCount: number;
  approvedCount: number;
  pendingReviewCount: number;
  avgProcessingTimeMs: number;
}

export interface FraudTrendDto {
  date: string;
  transactionCount: number;
  fraudCount: number;
  totalAmount: number;
  avgFraudProbability: number;
}

// ==================== TRANSACTION DTOs ====================
export interface PredictionDto {
  fraudProbability: number;
  decision: "Approve" | "Block" | "Review";
  modelVersion: string;
  createdAt: string;
}

export interface TransactionResponseDto {
  id: string;
  merchantId: string;
  customerId: string;
  amount: number;
  currency: string;
  country: string;
  mcc: number;
  status: "Pending" | "Approved" | "Blocked" | "Review";
  createdAt: string;
  prediction: PredictionDto | null;
  deviceId?: string;
  ipAddress?: string;
}

export interface CreateTransactionRequest {
  customerId: string;
  amount: number;
  currency: string;
  country: string;
  mcc: number;
  deviceId: string;
  ipAddress: string;
}

// ==================== ALERT DTOs ====================
export interface AlertDto {
  id: string;
  type: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  title: string;
  description: string;
  transactionId: string;
  isRead: boolean;
  createdAt: string;
}

// ==================== MERCHANT DTOs ====================
export interface MerchantProfileDto {
  id: string;
  companyName: string;
  email: string;
  country: string;
  apiKey: string;
  role: string;
  plan: "Starter" | "Business" | "Enterprise";
  createdAt: string;
  trialStartDate: string;
  trialEndDate: string;
  isTrialActive: boolean;
  hasPaymentMethod: boolean;
}

// ==================== SUBSCRIPTION DTOs ====================
export interface SubscriptionPlanDto {
  name: "Starter" | "Business" | "Enterprise";
  monthlyPrice: number;
  transactionLimit: number;
  features: string[];
}

// ==================== PAYMENT DTOs ====================
export interface CreatePaymentDto {
  merchantId: string;
  planName: "Starter" | "Business" | "Enterprise";
  amount: number;
  currency: string;
}

export interface ProcessPaymentDto {
  paymentId: string;
  gateway: string;
  token: string;
}

// ==================== SIGNALR EVENTS ====================
export interface FraudDetectedEvent {
  transactionId: string;
  fraudProbability: number;
  decision: "Approve" | "Block" | "Review";
}

export interface TransactionResolvedEvent {
  transactionId: string;
  status: "Pending" | "Approved" | "Blocked" | "Review";
  resolvedAt: string;
}

// ==================== API RESPONSE WRAPPER ====================
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[] | Record<string, string[]>;
}

// ==================== ERROR TYPES ====================
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors: string[] | Record<string, string[]> = []
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ==================== CHART DATA ====================
export interface ChartDataPoint {
  timestamp: string;
  transactionCount: number;
  fraudCount: number;
  totalAmount: number;
  avgFraudProbability: number;
}
