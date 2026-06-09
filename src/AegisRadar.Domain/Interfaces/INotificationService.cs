using AegisRadar.Shared.DTOs;

namespace AegisRadar.Domain.Interfaces;

public interface INotificationService
{
    Task SendFraudAlertAsync(Guid merchantId, AlertDto alert, CancellationToken cancellationToken = default);
    Task SendDashboardRefreshAsync(Guid merchantId, CancellationToken cancellationToken = default);
}
