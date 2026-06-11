namespace AegisRadar.Shared.DTOs;

public class AppNotificationDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "system";        // "fraud_alert" | "system" | "daily_summary"
    public string Severity { get; set; } = "low";       // "low" | "medium" | "high" | "critical"
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; }
}
