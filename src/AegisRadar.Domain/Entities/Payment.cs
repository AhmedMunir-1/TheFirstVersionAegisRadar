using AegisRadar.Domain.Enums;

namespace AegisRadar.Domain.Entities;

public class Payment : BaseEntity
{
    public Guid MerchantId { get; set; }
    public Guid PlanId { get; set; }
    public decimal Amount { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public string? TransactionReference { get; set; } // From payment gateway
    public DateTime PeriodStartDate { get; set; }
    public DateTime PeriodEndDate { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public string? FailureReason { get; set; }
    public string? PaymentMethodLast4 { get; set; }
    
    // ── Fraud Detection Fields ─────────────────────────────────────────────
    public bool IsFraudDetected { get; set; } = false;
    public decimal? FraudScore { get; set; }
    public string? FraudReason { get; set; }

    public Merchant Merchant { get; set; } = null!;
    public SubscriptionPlan Plan { get; set; } = null!;
}
