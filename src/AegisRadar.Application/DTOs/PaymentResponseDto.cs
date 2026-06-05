namespace AegisRadar.Application.DTOs;

public class PaymentResponseDto
{
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }
    public Guid PlanId { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? ProcessedAt { get; set; }
    public bool IsFraudDetected { get; set; }
    public decimal FraudScore { get; set; }
}
