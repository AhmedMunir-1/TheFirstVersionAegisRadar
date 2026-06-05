namespace AegisRadar.Domain.Entities;

public class Merchant : BaseEntity
{
    public string CompanyName { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Country { get; set; } = "EG";
    public string Role { get; set; } = "Admin";
    public Guid PlanId { get; set; }
    // ── Email verification / password reset ─────────────────────────────
    public bool IsEmailConfirmed { get; set; } = false;
    public string? EmailVerificationCode { get; set; }
    public DateTime? EmailVerificationExpires { get; set; }
    public string? PasswordResetCode { get; set; }
    public DateTime? PasswordResetExpires { get; set; }
    
    // ── Free Trial Fields ──────────────────────────────────────────────────
    public DateTime TrialStartDate { get; set; } = DateTime.UtcNow;
    public DateTime TrialEndDate { get; set; } = DateTime.UtcNow.AddDays(14);
    public bool IsTrialActive { get; set; } = true;
    public bool HasPaymentMethod { get; set; } = false;
    public string? PaymentMethodToken { get; set; }

    public SubscriptionPlan Plan { get; set; } = null!;
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    public ICollection<Alert> Alerts { get; set; } = new List<Alert>();
    public ICollection<MerchantSubscription> Subscriptions { get; set; } = new List<MerchantSubscription>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
