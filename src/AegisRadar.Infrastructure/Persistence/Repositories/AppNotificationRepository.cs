using AegisRadar.Domain.Entities;
using AegisRadar.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AegisRadar.Infrastructure.Persistence.Repositories;

public class AppNotificationRepository : Repository<AppNotification>, IAppNotificationRepository
{
    public AppNotificationRepository(AegisRadarDbContext context)
        : base(context)
    {
    }

    public async Task<IEnumerable<AppNotification>> GetByMerchantIdAsync(
        Guid merchantId, 
        int limit = 50, 
        CancellationToken cancellationToken = default)
    {
        return await Context.AppNotifications
            .Where(n => n.MerchantId == merchantId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetUnreadCountByMerchantIdAsync(
        Guid merchantId, 
        CancellationToken cancellationToken = default)
    {
        return await Context.AppNotifications
            .CountAsync(n => n.MerchantId == merchantId && !n.IsRead, cancellationToken);
    }
}
