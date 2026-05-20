using AegisRadar.Domain.Enums;

namespace AegisRadar.Domain.Entities;

public class Transaction : BaseEntity
{
    public Guid MerchantId { get; set; }
    public string CustomerId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "EGP";
    public string Country { get; set; } = string.Empty;
    public int Mcc { get; set; }
    public string DeviceId { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public TransactionStatus Status { get; set; } = TransactionStatus.Pending;

    public Merchant Merchant { get; set; } = null!;
    public Prediction? Prediction { get; set; }
    public TransactionHistory? History { get; set; }
    public ICollection<Alert> Alerts { get; set; } = new List<Alert>();
}
