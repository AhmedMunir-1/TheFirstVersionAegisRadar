namespace AegisRadar.Shared.DTOs;

public class AlertDto
{
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }
    public Guid TransactionId { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Severity { get; set; } = "Warning"; // "Info", "Warning", "Critical"
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
