using AegisRadar.Domain.Entities;

namespace AegisRadar.Domain.Interfaces;

public interface IAppNotificationRepository : IRepository<AppNotification>
{
    Task<IEnumerable<AppNotification>> GetByMerchantIdAsync(Guid merchantId, int limit = 50, CancellationToken cancellationToken = default);
    Task<int> GetUnreadCountByMerchantIdAsync(Guid merchantId, CancellationToken cancellationToken = default);
    Task MarkAllReadAsync(Guid merchantId, CancellationToken cancellationToken = default);
}
