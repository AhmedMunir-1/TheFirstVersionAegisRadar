using AegisRadar.Domain.Enums;

namespace AegisRadar.Domain.Entities;

public class Alert : BaseEntity
{
    public Guid MerchantId { get; set; }
    public Guid TransactionId { get; set; }
    public AlertSeverity Severity { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;

    public Merchant Merchant { get; set; } = null!;
    public Transaction Transaction { get; set; } = null!;
}
