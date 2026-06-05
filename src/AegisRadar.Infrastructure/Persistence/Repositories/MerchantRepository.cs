using AegisRadar.Domain.Entities;
using AegisRadar.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AegisRadar.Infrastructure.Persistence.Repositories;

public class MerchantRepository : Repository<Merchant>, IMerchantRepository
{
    public MerchantRepository(AegisRadarDbContext context)
        : base(context)
    {
    }

    public async Task<Merchant?> GetByApiKeyAsync(string apiKey, CancellationToken cancellationToken = default)
    {
        return await Context.Merchants
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.ApiKey == apiKey, cancellationToken);
    }

    public async Task<Merchant?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await Context.Merchants
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Email == email, cancellationToken);
    }

    public async Task<bool> ApiKeyExistsAsync(string apiKey, CancellationToken cancellationToken = default)
    {
        return await Context.Merchants
            .AnyAsync(m => m.ApiKey == apiKey, cancellationToken);
    }
}
