using AegisRadar.Domain.Entities;
using AegisRadar.Domain.Interfaces;
using AegisRadar.Shared.Wrappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace AegisRadar.API.Controllers;

[ApiController]
[Route("api/merchants")]
[Authorize]
[Produces("application/json")]
public class MerchantsController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public MerchantsController(IUnitOfWork uow) => _uow = uow;

    /// <summary>Get the profile of the authenticated merchant.</summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetMe(CancellationToken ct)
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                  User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (!Guid.TryParse(sub, out var merchantId)) return Unauthorized();

        var merchant = await _uow.Merchants.GetByIdAsync(merchantId, ct);
        if (merchant is null) return NotFound();

        return Ok(ApiResponse<object>.Ok(new
        {
            merchant.Id,
            merchant.CompanyName,
            merchant.Email,
            merchant.Country,
            merchant.ApiKey,
            merchant.Role,
            Plan = merchant.Plan?.Name ?? "Unknown",
            merchant.CreatedAt,
            merchant.TrialStartDate,
            merchant.TrialEndDate,
            merchant.IsTrialActive,
            merchant.HasPaymentMethod
        }));
    }
}

[ApiController]
[Route("api/subscriptions")]
[Produces("application/json")]
public class SubscriptionsController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public SubscriptionsController(IUnitOfWork uow) => _uow = uow;

    /// <summary>List all available subscription plans.</summary>
    [HttpGet("plans")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPlans(CancellationToken ct)
    {
        var plans = await _uow.Merchants.GetAllAsync(ct); // Use SubscriptionPlan repo when needed
        // Return from DbContext directly via a simple query
        return Ok(ApiResponse<object>.Ok(new[]
        {
            new { Name = "Starter",    MonthlyPrice = 299m,  TransactionLimit = 5000,  Features = new[] { "5,000 tx/month", "Basic analytics", "Email alerts" } },
            new { Name = "Business",   MonthlyPrice = 999m,  TransactionLimit = 25000, Features = new[] { "25,000 tx/month", "Advanced analytics", "Real-time alerts", "API access" } },
            new { Name = "Enterprise", MonthlyPrice = 2999m, TransactionLimit = -1,    Features = new[] { "Unlimited tx", "Full analytics suite", "Priority support", "Custom model training" } }
        }));
    }
}
