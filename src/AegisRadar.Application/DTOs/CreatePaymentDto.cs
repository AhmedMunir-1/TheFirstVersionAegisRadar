namespace AegisRadar.Application.DTOs;

public class CreatePaymentDto
{
    public Guid MerchantId { get; set; }
    public Guid PlanId { get; set; }
    public string PaymentMethodToken { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}
