namespace AegisRadar.Domain.Entities;

public class MerchantSubscription : BaseEntity
{
    public Guid MerchantId { get; set; }
    public Guid PlanId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; } = true;

    public Merchant Merchant { get; set; } = null!;
    public SubscriptionPlan Plan { get; set; } = null!;
}
