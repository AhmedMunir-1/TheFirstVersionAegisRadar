using AegisRadar.API.Hubs;
using AegisRadar.Shared.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace AegisRadar.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class NotificationsController : ControllerBase
{
    private readonly IHubContext<FraudAlertHub> _hubContext;
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(IHubContext<FraudAlertHub> hubContext, ILogger<NotificationsController> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    /// <summary>
    /// Broadcast a fraud alert to a specific merchant's connected clients.
    /// Used by the Worker service to push real-time notifications.
    /// </summary>
    [HttpPost("fraud-alert")]
    public async Task<IActionResult> SendFraudAlert([FromBody] BroadcastFraudAlertRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            await _hubContext.Clients
                .Group($"merchant-{request.MerchantId}")
                .SendAsync("FraudAlertReceived", request.Alert, cancellationToken);

            _logger.LogInformation("Broadcasted fraud alert for merchant {MerchantId}", request.MerchantId);
            return Ok(new { message = "Alert broadcasted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast fraud alert for merchant {MerchantId}", request.MerchantId);
            return StatusCode(500, new { error = "Failed to broadcast alert" });
        }
    }

    /// <summary>
    /// Broadcast a dashboard refresh signal to a specific merchant's connected clients.
    /// </summary>
    [HttpPost("dashboard-refresh")]
    public async Task<IActionResult> SendDashboardRefresh([FromBody] DashboardRefreshRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            await _hubContext.Clients
                .Group($"merchant-{request.MerchantId}")
                .SendAsync("DashboardRefresh", new { merchantId = request.MerchantId, refreshedAt = DateTime.UtcNow }, cancellationToken);

            _logger.LogInformation("Sent dashboard refresh for merchant {MerchantId}", request.MerchantId);
            return Ok(new { message = "Refresh signal sent successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send dashboard refresh for merchant {MerchantId}", request.MerchantId);
            return StatusCode(500, new { error = "Failed to send refresh signal" });
        }
    }

    /// <summary>
    /// Broadcast a transaction update to a specific merchant's connected clients.
    /// </summary>
    [HttpPost("transaction-update")]
    public async Task<IActionResult> SendTransactionUpdate([FromBody] BroadcastTransactionUpdateRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            await _hubContext.Clients
                .Group($"merchant-{request.MerchantId}")
                .SendAsync("TransactionUpdated", request.Transaction, cancellationToken);

            _logger.LogInformation("Sent transaction update for merchant {MerchantId}, TxId: {TxId}", request.MerchantId, request.Transaction.Id);
            return Ok(new { message = "Transaction update broadcasted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast transaction update for merchant {MerchantId}", request.MerchantId);
            return StatusCode(500, new { error = "Failed to broadcast transaction update" });
        }
    }
}

/// <summary>Request model for broadcasting fraud alerts.</summary>
public class BroadcastFraudAlertRequest
{
    public Guid MerchantId { get; set; }
    public required AlertDto Alert { get; set; }
}

/// <summary>Request model for sending dashboard refresh signals.</summary>
public class DashboardRefreshRequest
{
    public Guid MerchantId { get; set; }
}

/// <summary>Request model for broadcasting transaction updates.</summary>
public class BroadcastTransactionUpdateRequest
{
    public Guid MerchantId { get; set; }
    public required TransactionResponseDto Transaction { get; set; }
}
