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
// Matches AegisRadar.Shared.DTOs.DashboardStatsDto (C# → camelCase JSON)
export interface DashboardStatsDto {
  totalTransactions: number;       // monthly total
  fraudulentCount: number;         // total blocked ever
  reviewCount: number;             // total in review ever
  approvedCount: number;           // total approved ever
  blockedCount: number;            // total blocked ever (same as fraudulentCount)
  pendingReviewCount: number;      // currently in review
  totalAmount: number;             // total amount (monthly)
  totalAmountToday: number;        // total amount today
  totalTransactionsToday: number;  // transactions today
  fraudRate: number;               // fraud rate overall (0–100)
  fraudRateToday: number;          // fraud rate today (0–100)
}

// Matches AegisRadar.Shared.DTOs.FraudTrendDto (C# → camelCase JSON)
export interface FraudTrendDto {
  date: string;                    // ISO date string
  count: number;                   // same as transactionCount
  transactionCount: number;
  fraudCount: number;
  totalAmount: number;
  percentage: number;
  avgFraudProbability: number;     // 0.0 – 1.0
}

// ==================== TRANSACTION DTOs ====================
export interface PredictionDto {
  fraudProbability: number;
  decision: string;
  modelVersion: string;
  createdAt: string;
  amountRatio: number;
  hour: number;
  isForeign: boolean;
  userDegree: number;
  merchantDegree: number;
  userFrequencyPerDay: number;
  timeDifferenceHours: number;
}

// Matches AegisRadar.Shared.DTOs.TransactionResponseDto (C# → camelCase JSON)
export interface TransactionResponseDto {
  id: string;
  merchantId: string;
  customerId: string;
  amount: number;
  currency: string;
  status: string;                  // "Pending" | "Approved" | "Blocked" | "Review"
  transactionCountry: string;      // NOTE: field is transactionCountry, not country
  merchantCountry: string;
  mcc: number;
  deviceId: string;
  ipAddress: string;
  createdAt: string;
  prediction: PredictionDto | null;
}

export interface CreateTransactionRequest {
  customerId: string;
  amount: number;
  currency: string;
  transactionCountry: string;
  mcc: number;
  deviceId: string;
  ipAddress: string;
}

export interface ReviewDecisionDto {
  decision: "approve" | "block";
  note?: string;
}

// ==================== ALERT DTOs ====================
export interface AlertDto {
  id: string;
  merchantId: string;
  transactionId: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  message: string;
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
  decision: string;
}

export interface TransactionResolvedEvent {
  transactionId: string;
  status: string;
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

// ==================== ANALYTICS DTOs ====================
export interface TrendsDto {
  labels: string[];
  fraudRate: number[];
  transactionVolume: number[];
}

export interface HourlyDistributionDto {
  bucket: string;
  count: number;
  fraudRate: number;
}

export interface AnalyticsSummaryDto {
  totalTransactions: number;
  totalFraudulent: number;
  fraudRate: number;
  overallRiskScore: number;
  blockedTransactions: number;
  avgResponseTimeMs: number;
  trends: TrendsDto;
  topRiskyMerchants: string[];
  hourlyDistribution: HourlyDistributionDto[];
  lastUpdated: string;
}

// ==================== POSTURE DTOs ====================
export interface ThreatDto {
  id: string;
  name: string;
  count: number;
  delta: number;
  severity: string;
  lastSeen: string;
}

export interface RecommendationDto {
  priority: string;
  title: string;
  body: string;
  effort: string;
}

export interface PostureSummaryDto {
  fraudPrevention: number;
  authStrength: number;
  modelAccuracy: number;
  responseCoverage: number;
  policyCompliance: number;
  overallScore: number;
  quickStats: QuickStatDto[];
  riskCards: RiskCardDto[];
  insights: InsightDto[];
  threats: ThreatDto[];
  recommendations: RecommendationDto[];
  trend: number[];
  reportPeriod: string;
  business: string;
  lastScan: string;
}

export interface QuickStatDto {
  label: string;
  value: number;
}

export interface RiskCardDto {
  title: string;
  value: string;
  icon: string;
}

export interface InsightDto {
  title: string;
  description: string;
}

// ==================== HISTORY DTOs ====================
export interface HistoryTransactionDto extends TransactionResponseDto {
  riskLevel: string; // HIGH, MEDIUM, LOW
}

export interface HistoryResponseDto {
  transactions: HistoryTransactionDto[];
  total: number;
  fraudCount: number;
  reviewCount: number;
  totalAmount: number;
}

// ==================== TEAM DTOs ====================
export interface TeamMemberDto {
  id: string;
  companyName: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export interface InviteTeamMemberDto {
  email: string;
  companyName: string;
  role: string;
}

export interface UpdateRoleDto {
  role: string;
}

export interface UpdateRoleResponseDto {
  id: string;
  role: string;
}

// ==================== SETTINGS DTOs ====================
export interface GeneralSettingsDto {
  organizationName: string;
  email: string;
}

export interface SecuritySettingsDto {
  fraudThreshold: number;
  autoBlockHighRisk: boolean;
  twoFactorEnabled: boolean;
}

export interface NotificationsSettingsDto {
  dailyDigest: boolean;
  emailNotifications: boolean;
}

export interface ApiSettingsDto {
  apiKey: string;
}

export interface AppearanceSettingsDto {
  theme: string;
  language: string;
}

export interface SettingsDto {
  general: GeneralSettingsDto;
  security: SecuritySettingsDto;
  notifications: NotificationsSettingsDto;
  api: ApiSettingsDto;
  appearance: AppearanceSettingsDto;
}

export interface UpdateSettingsRequestDto {
  general?: GeneralSettingsDto;
  security?: SecuritySettingsDto;
  notifications?: NotificationsSettingsDto;
  api?: ApiSettingsDto;
  appearance?: AppearanceSettingsDto;
}

export interface UpdateSettingsResponseDto {
  success: boolean;
  timestamp: string;
  updatedBy: string;
}

// ==================== API KEYS DTOs ====================
export interface MerchantApiKeyDto {
  id: string;
  keyName: string;
  apiKey: string;
  isActive: boolean;
  lastUsedAt?: string;
  createdAt: string;
}

export interface CreateApiKeyRequestDto {
  keyName: string;
}

export interface CreateApiKeyResponseDto {
  id: string;
  keyName: string;
  apiKey: string;
  createdAt: string;
}

// ==================== APP NOTIFICATIONS DTOs ====================
export interface AppNotificationDto {
  id: string;
  title: string;
  message: string;
  type: string; // fraud_alert, system, daily_summary
  severity: string; // low, medium, high, critical
  isRead: boolean;
  createdAt: string;
}

// ==================== DEMO DTOs ====================
export interface DemoStatusDto {
  status: string;
  modelVersion: string;
  accuracy: number;
  totalTransactions: number;
  avgResponseMs: number;
  fraudDetectedToday: number;
  lastTrained: string;
  serverUptime: string;
}

export interface DemoTransactionDto {
  transactionId: string;
  merchant: string;
  amount: number;
  timestamp: string;
  velocity1h: number;
  velocity24h: number;
  merchantCategory: string;
}

export interface BatchTestResponseDto {
  transactions: DemoTransactionDto[];
}
