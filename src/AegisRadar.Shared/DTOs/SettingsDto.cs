namespace AegisRadar.Shared.DTOs;

public class SettingsDto
{
    public GeneralSettingsDto General { get; set; } = new();
    public SecuritySettingsDto Security { get; set; } = new();
    public NotificationsSettingsDto Notifications { get; set; } = new();
    public ApiSettingsDto Api { get; set; } = new();
    public AppearanceSettingsDto Appearance { get; set; } = new();
}

public class GeneralSettingsDto
{
    public string OrganizationName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Country { get; set; } = "EG";
    public string Timezone { get; set; } = "Africa/Cairo";
    public string Language { get; set; } = "en";
    public string Division { get; set; } = "E-Commerce Division";
    public string Industry { get; set; } = "Retail & Banking";
}

public class SecuritySettingsDto
{
    public double FraudThreshold { get; set; } = 0.65;
    public bool AutoBlockHighRisk { get; set; } = true;
    public bool RequireStepUpAuth { get; set; } = true;
    public bool BlockVpn { get; set; } = true;
    public bool TwoFactorEnabled { get; set; } = true;
}

public class NotificationsSettingsDto
{
    public bool EmailAlerts { get; set; } = true;
    public bool SmsAlerts { get; set; } = false;
    public bool InAppAlerts { get; set; } = true;
    public string? SlackWebhook { get; set; }
}

public class ApiSettingsDto
{
    public string? WebhookUrl { get; set; }
    public string? WebhookSecret { get; set; }
}

public class AppearanceSettingsDto
{
    public string Theme { get; set; } = "dark";
    public string Density { get; set; } = "comfortable";
    public string FontSize { get; set; } = "medium";
    public string DateFormat { get; set; } = "DD/MM/YYYY";
    public bool AnimationsEnabled { get; set; } = true;
}

public class UpdateSettingsRequestDto
{
    public GeneralSettingsDto? General { get; set; }
    public SecuritySettingsDto? Security { get; set; }
    public NotificationsSettingsDto? Notifications { get; set; }
    public ApiSettingsDto? Api { get; set; }
    public AppearanceSettingsDto? Appearance { get; set; }
}

public class UpdateSettingsResponseDto
{
    public string Message { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
    public string UpdatedBy { get; set; } = string.Empty;
}
