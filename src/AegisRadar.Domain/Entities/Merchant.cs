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

    public SubscriptionPlan Plan { get; set; } = null!;
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    public ICollection<Alert> Alerts { get; set; } = new List<Alert>();
    public ICollection<MerchantSubscription> Subscriptions { get; set; } = new List<MerchantSubscription>();
}
