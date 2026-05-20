namespace AegisRadar.Shared.Events;

public class TransactionCreatedEvent
{
    public Guid TransactionId { get; set; }
    public Guid MerchantId { get; set; }
    public string CustomerId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "EGP";
    public string TransactionCountry { get; set; } = string.Empty;
    public string MerchantCountry { get; set; } = "EG";
    public int Mcc { get; set; }
    public string DeviceId { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
