namespace AegisRadar.Shared.DTOs;

public class MerchantDto
{
    public Guid Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Country { get; set; } = "EG";
    public string ApiKey { get; set; } = string.Empty;
    public string Role { get; set; } = "Admin";
    public string Plan { get; set; } = "Free";
    public DateTime CreatedAt { get; set; }
    public bool IsTrialActive { get; set; } = false;
    public DateTime? TrialStartDate { get; set; }
    public DateTime? TrialEndDate { get; set; }
    public bool HasPaymentMethod { get; set; } = false;
}
