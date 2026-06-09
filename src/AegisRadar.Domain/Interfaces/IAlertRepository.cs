using AegisRadar.Domain.Entities;

namespace AegisRadar.Domain.Interfaces;

public interface IAlertRepository : IRepository<Alert>
{
    Task<IEnumerable<Alert>> GetByMerchantIdAsync(Guid merchantId, bool unreadOnly = false, CancellationToken cancellationToken = default);
    Task<int> GetUnreadCountAsync(Guid merchantId, CancellationToken cancellationToken = default);
    Task MarkAllAlertsReadAsync(Guid merchantId, CancellationToken cancellationToken = default);
}
