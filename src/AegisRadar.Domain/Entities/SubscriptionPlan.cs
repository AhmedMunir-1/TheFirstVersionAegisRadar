using AegisRadar.Domain.Enums;

namespace AegisRadar.Domain.Entities;

public class SubscriptionPlan : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public decimal MonthlyPrice { get; set; }
    public int TransactionLimit { get; set; } // -1 = unlimited

    public ICollection<Merchant> Merchants { get; set; } = new List<Merchant>();
    public ICollection<MerchantSubscription> MerchantSubscriptions { get; set; } = new List<MerchantSubscription>();
}
