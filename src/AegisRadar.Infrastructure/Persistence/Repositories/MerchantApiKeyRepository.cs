using AegisRadar.Domain.Entities;
using AegisRadar.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AegisRadar.Infrastructure.Persistence.Repositories;

public class MerchantApiKeyRepository : Repository<MerchantApiKey>, IMerchantApiKeyRepository
{
    public MerchantApiKeyRepository(AegisRadarDbContext context)
        : base(context)
    {
    }

    public async Task<IEnumerable<MerchantApiKey>> GetActiveByMerchantIdAsync(
        Guid merchantId, 
        CancellationToken cancellationToken = default)
    {
        return await Context.MerchantApiKeys
            .Where(k => k.MerchantId == merchantId && k.IsActive)
            .OrderByDescending(k => k.CreatedAt)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<MerchantApiKey?> GetByKeyAsync(
        string apiKey, 
        CancellationToken cancellationToken = default)
    {
        return await Context.MerchantApiKeys
            .FirstOrDefaultAsync(k => k.ApiKey == apiKey && k.IsActive, cancellationToken);
    }
}
