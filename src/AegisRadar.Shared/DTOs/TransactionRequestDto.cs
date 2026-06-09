namespace AegisRadar.Shared.DTOs;

public class TransactionRequestDto
{
    public string CustomerId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public string TransactionCountry { get; set; } = string.Empty;
    public string MerchantCountry { get; set; } = string.Empty;
    public int Mcc { get; set; }
    public string DeviceId { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
}
