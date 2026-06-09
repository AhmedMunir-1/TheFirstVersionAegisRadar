using AegisRadar.Shared.Constants;
using AegisRadar.Shared.DTOs;
using Microsoft.AspNetCore.SignalR;

namespace AegisRadar.API.Hubs;

/// <summary>
/// SignalR hub for real-time fraud alerts and dashboard updates.
/// Clients join a merchant-specific group to receive targeted events.
/// </summary>
public class FraudAlertHub : Hub
{
    private readonly ILogger<FraudAlertHub> _logger;

    public FraudAlertHub(ILogger<FraudAlertHub> logger)
    {
        _logger = logger;
    }

    /// <summary>Merchant dashboard joins its own group on connect.</summary>
    public async Task JoinMerchantGroup(string merchantId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"merchant-{merchantId}");
        _logger.LogInformation("Connection {ConnectionId} joined group merchant-{MerchantId}", Context.ConnectionId, merchantId);
        await Clients.Caller.SendAsync("Joined", $"Connected to fraud alerts for merchant {merchantId}");
    }

    public async Task LeaveMerchantGroup(string merchantId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"merchant-{merchantId}");
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogDebug("Client connected: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogDebug("Client disconnected: {ConnectionId}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}

/// <summary>
/// Internal service used by the worker and controllers to push to SignalR groups.
/// </summary>
public class HubNotificationService
{
    private readonly IHubContext<FraudAlertHub> _hubContext;

    public HubNotificationService(IHubContext<FraudAlertHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public Task SendFraudAlertAsync(Guid merchantId, AlertDto alert)
        => _hubContext.Clients
            .Group($"merchant-{merchantId}")
            .SendAsync(SignalRMethods.FraudAlertReceived, alert);

    public Task SendDashboardRefreshAsync(Guid merchantId)
        => _hubContext.Clients
            .Group($"merchant-{merchantId}")
            .SendAsync(SignalRMethods.DashboardRefresh, new { merchantId, refreshedAt = DateTime.UtcNow });

    public Task SendTransactionUpdateAsync(Guid merchantId, TransactionResponseDto transaction)
        => _hubContext.Clients
            .Group($"merchant-{merchantId}")
            .SendAsync(SignalRMethods.TransactionUpdated, transaction);
}
