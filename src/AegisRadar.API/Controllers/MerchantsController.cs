using AegisRadar.Domain.Interfaces;
using AegisRadar.Shared.DTOs;
using AegisRadar.Shared.Wrappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AegisRadar.API.Controllers;

[ApiController]
[Route("api/merchants")]
[Produces("application/json")]
[Authorize]
public class MerchantsController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public MerchantsController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponse<MerchantDto>), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetCurrentMerchant(CancellationToken ct)
    {
        // Get merchant ID from JWT claims
        var merchantIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (merchantIdClaim is null || !Guid.TryParse(merchantIdClaim.Value, out var merchantId))
            return Unauthorized(ApiResponse<MerchantDto>.Fail("Invalid token."));

        var merchant = await _uow.Merchants.GetByIdAsync(merchantId, ct);
        if (merchant is null)
            return NotFound(ApiResponse<MerchantDto>.Fail("Merchant not found."));

        var dto = new MerchantDto
        {
            Id = merchant.Id,
            CompanyName = merchant.CompanyName,
            Email = merchant.Email,
            Country = merchant.Country,
            ApiKey = merchant.ApiKey,
            Role = merchant.Role,
            Plan = "Free",  // TODO: Add plan field to Merchant entity
            CreatedAt = merchant.CreatedAt,
            IsTrialActive = false,  // TODO: Add trial fields to Merchant entity
            TrialStartDate = null,
            TrialEndDate = null,
            HasPaymentMethod = false  // TODO: Add payment method field to Merchant entity
        };

        return Ok(ApiResponse<MerchantDto>.Ok(dto, "Merchant data retrieved successfully."));
    }
}
