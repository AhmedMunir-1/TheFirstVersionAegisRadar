namespace AegisRadar.Shared.DTOs;

public class TransactionResponseDto
{
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }
    public string CustomerId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public string Status { get; set; } = "approved"; // "approved", "review", "blocked"
    public string TransactionCountry { get; set; } = string.Empty;
    public string MerchantCountry { get; set; } = string.Empty;
    public int Mcc { get; set; }
    public string DeviceId { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public PredictionResponseDto? Prediction { get; set; }
}
