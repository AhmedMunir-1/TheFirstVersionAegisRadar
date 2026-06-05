using AegisRadar.Domain.Entities;
using AegisRadar.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AegisRadar.Infrastructure.Persistence.Repositories;

public class AlertRepository : Repository<Alert>, IAlertRepository
{
    public AlertRepository(AegisRadarDbContext context)
        : base(context)
    {
    }

    public async Task<IEnumerable<Alert>> GetByMerchantIdAsync(Guid merchantId, bool unreadOnly = false, CancellationToken cancellationToken = default)
    {
        var query = Context.Alerts
            .Where(a => a.MerchantId == merchantId);

        if (unreadOnly)
        {
            query = query.Where(a => !a.IsRead);
        }

        return await query
            .OrderByDescending(a => a.CreatedAt)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetUnreadCountAsync(Guid merchantId, CancellationToken cancellationToken = default)
    {
        return await Context.Alerts
            .CountAsync(a => a.MerchantId == merchantId && !a.IsRead, cancellationToken);
    }
}
