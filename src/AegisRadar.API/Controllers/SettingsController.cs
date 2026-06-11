using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using AegisRadar.Shared.Wrappers;
using AegisRadar.Shared.DTOs;
using AegisRadar.Domain.Interfaces;

namespace AegisRadar.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SettingsController(IUnitOfWork unitOfWork, ILogger<SettingsController> logger) : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork = unitOfWork;
    private readonly ILogger<SettingsController> _logger = logger;

    /// <summary>
    /// Get current merchant settings
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetSettings(CancellationToken ct)
    {
        try
        {
            var merchantIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(merchantIdClaim, out var merchantId))
            {
                return Unauthorized("Invalid authentication token");
            }

            var merchant = await _unitOfWork.Merchants.GetByIdAsync(merchantId, ct);
            if (merchant is null)
            {
                return NotFound("Merchant not found");
            }

            var settings = new SettingsDto
            {
                General = new GeneralSettingsDto
                {
                    OrganizationName = merchant.CompanyName,
                    Email = merchant.Email,
                    Country = merchant.Country ?? "EG",
                    Timezone = "Africa/Cairo",
                    Language = "en",
                    Division = "E-Commerce Division",
                    Industry = "Retail & Banking"
                },
                Security = new SecuritySettingsDto
                {
                    FraudThreshold = 0.65,
                    AutoBlockHighRisk = true,
                    RequireStepUpAuth = true,
                    BlockVpn = true,
                    TwoFactorEnabled = true
                },
                Notifications = new NotificationsSettingsDto
                {
                    EmailAlerts = true,
                    SmsAlerts = false,
                    InAppAlerts = true,
                    SlackWebhook = null
                },
                Api = new ApiSettingsDto
                {
                    WebhookUrl = null,
                    WebhookSecret = null
                },
                Appearance = new AppearanceSettingsDto
                {
                    Theme = "dark",
                    Density = "comfortable",
                    FontSize = "medium",
                    DateFormat = "DD/MM/YYYY",
                    AnimationsEnabled = true
                }
            };

            return Ok(ApiResponse<SettingsDto>.Ok(settings));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching settings");
            return StatusCode(500, ApiResponse<SettingsDto>.Fail("Failed to fetch settings"));
        }
    }

    /// <summary>
    /// Update merchant settings (Admin only)
    /// </summary>
    [HttpPut]
    public async Task<IActionResult> UpdateSettings(
        [FromBody] UpdateSettingsRequestDto dto,
        CancellationToken ct)
    {
        try
        {
            var merchantIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(merchantIdClaim, out var merchantId))
            {
                return Unauthorized("Invalid authentication token");
            }

            var merchant = await _unitOfWork.Merchants.GetByIdAsync(merchantId, ct);
            if (merchant is null)
            {
                return NotFound("Merchant not found");
            }

            // Admin check
            if (merchant.Role != "Admin")
            {
                return Forbid("Only admins can update settings");
            }

            // Update general settings
            if (dto.General != null && !string.IsNullOrEmpty(dto.General.OrganizationName))
            {
                merchant.CompanyName = dto.General.OrganizationName;
            }

            await _unitOfWork.SaveChangesAsync(ct);

            var response = new UpdateSettingsResponseDto
            {
                Message = "Settings updated successfully",
                UpdatedAt = DateTime.UtcNow,
                UpdatedBy = merchant.Email
            };

            return Ok(ApiResponse<UpdateSettingsResponseDto>.Ok(response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating settings");
            return StatusCode(500, ApiResponse<UpdateSettingsResponseDto>.Fail("Failed to update settings"));
        }
    }
}
