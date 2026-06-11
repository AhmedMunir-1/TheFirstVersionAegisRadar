namespace AegisRadar.Shared.DTOs;

public class MerchantApiKeyDto
{
    public string Id { get; set; } = string.Empty;
    public string KeyName { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime? LastUsedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateApiKeyRequestDto
{
    public string KeyName { get; set; } = string.Empty;
}

public class CreateApiKeyResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string KeyName { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
