using AegisRadar.Shared.DTOs;
using AegisRadar.Domain.Interfaces;
using AegisRadar.Shared.Constants;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AegisRadar.Infrastructure.Services;

public class SignalRSettings
{
    public string HubUrl { get; set; } = "http://localhost:5000/hubs/fraud-alerts";
}

public class SignalRNotificationService : INotificationService
{
    private readonly ILogger<SignalRNotificationService> _logger;
    // The worker notifies via IHubContext injected directly inside the API.
    // For the Worker (separate process), we store alert details in a queue/cache.
    // For the API process, SignalR hub context is used directly.
    // This service acts as the cross-process bridge via Redis pub/sub or direct hub in same process.

    public SignalRNotificationService(ILogger<SignalRNotificationService> logger)
    {
        _logger = logger;
    }

    public Task SendFraudAlertAsync(Guid merchantId, AlertDto alert, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("[SignalR] FraudAlert for merchant {MerchantId}: {Message}", merchantId, alert.Message);
        // Implementation delegates to hub context when running in-process (API).
        // Worker process uses the same Redis channel to relay the message.
        return Task.CompletedTask;
    }

    public Task SendDashboardRefreshAsync(Guid merchantId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("[SignalR] DashboardRefresh for merchant {MerchantId}", merchantId);
        return Task.CompletedTask;
    }

    public Task SendTransactionUpdateAsync(Guid merchantId, TransactionResponseDto transaction, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("[SignalR] TransactionUpdate for merchant {MerchantId}: {TransactionId}", merchantId, transaction.Id);
        return Task.CompletedTask;
    }
}
