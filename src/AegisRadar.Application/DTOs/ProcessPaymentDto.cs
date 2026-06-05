namespace AegisRadar.Application.DTOs;

public class ProcessPaymentDto
{
    public Guid PaymentId { get; set; }
    public string TransactionReference { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}
