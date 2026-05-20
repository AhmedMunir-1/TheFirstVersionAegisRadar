using AegisRadar.Application.DTOs;

namespace AegisRadar.Application.Interfaces;

public interface INotificationService
{
    Task SendFraudAlertAsync(Guid merchantId, AlertDto alert, CancellationToken cancellationToken = default);
    Task SendDashboardRefreshAsync(Guid merchantId, CancellationToken cancellationToken = default);
    Task SendTransactionUpdateAsync(Guid merchantId, TransactionResponseDto transaction, CancellationToken cancellationToken = default);
}
