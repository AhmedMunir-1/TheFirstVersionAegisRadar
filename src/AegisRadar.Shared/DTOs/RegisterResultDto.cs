namespace AegisRadar.Shared.DTOs;

public class RegisterResultDto
{
    public Guid MerchantId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
}
