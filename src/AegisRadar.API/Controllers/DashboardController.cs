using AegisRadar.Application.DTOs;
using AegisRadar.Application.Features.Dashboard.Queries;
using AegisRadar.Shared.Wrappers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace AegisRadar.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
[Produces("application/json")]
public class DashboardController : ControllerBase
{
    private readonly IMediator _mediator;

    public DashboardController(IMediator mediator) => _mediator = mediator;

    /// <summary>Get real-time dashboard statistics for the authenticated merchant.</summary>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(ApiResponse<DashboardStatsDto>), 200)]
    public async Task<IActionResult> GetStats(CancellationToken ct)
    {
        var merchantId = GetMerchantId();
        if (merchantId == Guid.Empty) return Unauthorized();

        var stats = await _mediator.Send(new GetDashboardStatsQuery(merchantId), ct);
        return Ok(ApiResponse<DashboardStatsDto>.Ok(stats));
    }

    /// <summary>Get fraud trends for the last N days (default: 7).</summary>
    [HttpGet("trends")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<FraudTrendDto>>), 200)]
    public async Task<IActionResult> GetTrends([FromQuery] int days = 7, CancellationToken ct = default)
    {
        var merchantId = GetMerchantId();
        if (merchantId == Guid.Empty) return Unauthorized();

        var trends = await _mediator.Send(new GetFraudTrendsQuery(merchantId, days), ct);
        return Ok(ApiResponse<IEnumerable<FraudTrendDto>>.Ok(trends));
    }

    /// <summary>Get the most recent transactions for the dashboard feed.</summary>
    [HttpGet("recent")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<TransactionResponseDto>>), 200)]
    public async Task<IActionResult> GetRecent([FromQuery] int count = 10, CancellationToken ct = default)
    {
        var merchantId = GetMerchantId();
        if (merchantId == Guid.Empty) return Unauthorized();

        var recent = await _mediator.Send(new GetRecentTransactionsQuery(merchantId, count), ct);
        return Ok(ApiResponse<IEnumerable<TransactionResponseDto>>.Ok(recent));
    }

    private Guid GetMerchantId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                  User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        return Guid.TryParse(sub, out var id) ? id : Guid.Empty;
    }
}
