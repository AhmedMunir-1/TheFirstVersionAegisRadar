namespace AegisRadar.Application.DTOs;

public record AlertDto(
    Guid Id,
    Guid MerchantId,
    Guid TransactionId,
    string Severity,
    string Message,
    bool IsRead,
    DateTime CreatedAt
);

public record DashboardStatsDto(
    int TransactionsToday,
    int FlaggedToday,
    int BlockedToday,
    int UnreadAlerts,
    double ApprovalRate,
    double AvgFraudProbability,
    decimal TotalVolumeToday
);

public record FraudTrendDto(
    string Date,
    int Approved,
    int Review,
    int Blocked
);

public record MerchantAnalyticsDto(
    Guid MerchantId,
    string CompanyName,
    int TotalTransactions,
    int BlockedTransactions,
    double FraudRate,
    string PlanName
);

public record LoginRequestDto(string Email, string Password);

public record LoginResponseDto(string Token, string Email, string CompanyName, string Role, DateTime Expires);

public record RegisterMerchantDto(
    string CompanyName,
    string Email,
    string Password,
    string Country
);
