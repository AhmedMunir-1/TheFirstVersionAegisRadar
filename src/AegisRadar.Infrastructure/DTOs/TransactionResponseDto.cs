namespace AegisRadar.Infrastructure.DTOs;

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
    public int MCC { get; set; }
    public DateTime CreatedAt { get; set; }
}
