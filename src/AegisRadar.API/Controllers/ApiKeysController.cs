using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using AegisRadar.Shared.Wrappers;
using AegisRadar.Shared.DTOs;
using AegisRadar.Domain.Interfaces;
using AegisRadar.Domain.Entities;

namespace AegisRadar.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ApiKeysController(IUnitOfWork unitOfWork, ILogger<ApiKeysController> logger) : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork = unitOfWork;
    private readonly ILogger<ApiKeysController> _logger = logger;

    /// <summary>
    /// Get all active API keys for the current merchant
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetApiKeys(CancellationToken ct)
    {
        try
        {
            var merchantIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(merchantIdClaim, out var merchantId))
            {
                return Unauthorized("Invalid authentication token");
            }

            var keys = await _unitOfWork.MerchantApiKeys.GetActiveByMerchantIdAsync(merchantId, ct);

            var response = keys
                .Select(k => new MerchantApiKeyDto
                {
                    Id = k.Id.ToString(),
                    KeyName = k.KeyName,
                    ApiKey = k.ApiKey,
                    IsActive = k.IsActive,
                    LastUsedAt = k.LastUsedAt,
                    CreatedAt = k.CreatedAt
                })
                .ToList();

            return Ok(ApiResponse<List<MerchantApiKeyDto>>.Ok(response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching API keys");
            return StatusCode(500, ApiResponse<List<MerchantApiKeyDto>>.Fail("Failed to fetch API keys"));
        }
    }

    /// <summary>
    /// Create a new API key (Admin only)
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateApiKey(
        [FromBody] CreateApiKeyRequestDto dto,
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
                return Forbid("Only admins can create API keys");
            }

            // Generate key
            var apiKey = "ak_" + Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");

            var newKey = new MerchantApiKey
            {
                MerchantId = merchantId,
                KeyName = dto.KeyName,
                ApiKey = apiKey,
                IsActive = true,
                LastUsedAt = null
            };

            await _unitOfWork.MerchantApiKeys.AddAsync(newKey, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            var response = new CreateApiKeyResponseDto
            {
                Id = newKey.Id.ToString(),
                KeyName = newKey.KeyName,
                ApiKey = newKey.ApiKey,
                CreatedAt = newKey.CreatedAt
            };

            return Ok(ApiResponse<CreateApiKeyResponseDto>.Ok(response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating API key");
            return StatusCode(500, ApiResponse<CreateApiKeyResponseDto>.Fail("Failed to create API key"));
        }
    }

    /// <summary>
    /// Delete (soft delete) an API key (Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteApiKey(Guid id, CancellationToken ct)
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
                return Forbid("Only admins can delete API keys");
            }

            var key = await _unitOfWork.MerchantApiKeys.GetByIdAsync(id, ct);
            if (key is null)
            {
                return NotFound("API key not found");
            }

            // Verify ownership
            if (key.MerchantId != merchantId)
            {
                return Forbid("Cannot delete API keys from other merchants");
            }

            // Soft delete
            key.IsActive = false;
            await _unitOfWork.SaveChangesAsync(ct);

            var response = new { message = "API key revoked" };
            return Ok(ApiResponse<object>.Ok(response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting API key");
            return StatusCode(500, ApiResponse<object>.Fail("Failed to delete API key"));
        }
    }
}
