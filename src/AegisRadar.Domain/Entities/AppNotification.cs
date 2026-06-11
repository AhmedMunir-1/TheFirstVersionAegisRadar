namespace AegisRadar.Domain.Entities;

public class AppNotification : BaseEntity
{
    public Guid MerchantId { get; set; }
    public Merchant Merchant { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "system";        // "fraud_alert" | "system" | "daily_summary"
    public string Severity { get; set; } = "low";       // "low" | "medium" | "high" | "critical"
    public bool IsRead { get; set; } = false;
}
