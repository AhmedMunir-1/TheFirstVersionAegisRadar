using AegisRadar.Application.DTOs;
using AegisRadar.Application.Features.Alerts.Commands;
using AegisRadar.Application.Features.Alerts.Queries;
using AegisRadar.Shared.Wrappers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace AegisRadar.API.Controllers;

[ApiController]
[Route("api/alerts")]
[Authorize]
[Produces("application/json")]
public class AlertsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AlertsController(IMediator mediator) => _mediator = mediator;

    /// <summary>List all alerts for the authenticated merchant.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<AlertDto>>), 200)]
    public async Task<IActionResult> GetAll([FromQuery] bool unreadOnly = false, CancellationToken ct = default)
    {
        var merchantId = GetMerchantId();
        if (merchantId == Guid.Empty) return Unauthorized();

        var alerts = await _mediator.Send(new GetAlertsQuery(merchantId, unreadOnly), ct);
        return Ok(ApiResponse<IEnumerable<AlertDto>>.Ok(alerts));
    }

    /// <summary>Mark a specific alert as read.</summary>
    [HttpPut("{id:guid}/read")]
    [ProducesResponseType(typeof(ApiResponse<bool>), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken ct)
    {
        var merchantId = GetMerchantId();
        if (merchantId == Guid.Empty) return Unauthorized();

        var success = await _mediator.Send(new MarkAlertReadCommand(id, merchantId), ct);
        if (!success) return NotFound(ApiResponse<bool>.Fail("Alert not found or does not belong to this merchant."));

        return Ok(ApiResponse<bool>.Ok(true, "Alert marked as read."));
    }

    /// <summary>Mark all alerts as read for the authenticated merchant.</summary>
    [HttpPut("read-all")]
    [ProducesResponseType(typeof(ApiResponse<bool>), 200)]
    public async Task<IActionResult> MarkAllRead(CancellationToken ct)
    {
        var merchantId = GetMerchantId();
        if (merchantId == Guid.Empty) return Unauthorized();

        var alerts = await _mediator.Send(new GetAlertsQuery(merchantId, true), ct);
        foreach (var alert in alerts)
            await _mediator.Send(new MarkAlertReadCommand(alert.Id, merchantId), ct);

        return Ok(ApiResponse<bool>.Ok(true, "All alerts marked as read."));
    }

    private Guid GetMerchantId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                  User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        return Guid.TryParse(sub, out var id) ? id : Guid.Empty;
    }
}
