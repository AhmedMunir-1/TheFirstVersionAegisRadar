namespace AegisRadar.Domain.Entities;

public class Merchant : BaseEntity
{
    public string CompanyName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Country { get; set; } = "EG";
    public string ApiKey { get; set; } = string.Empty;
    public string Role { get; set; } = "Admin";
    public bool IsEmailConfirmed { get; set; } = true;
    public Guid? OrganizationId { get; set; }

    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    public ICollection<Alert> Alerts { get; set; } = new List<Alert>();
}
