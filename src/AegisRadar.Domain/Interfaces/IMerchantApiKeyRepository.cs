using AegisRadar.Domain.Entities;

namespace AegisRadar.Domain.Interfaces;

public interface IMerchantApiKeyRepository : IRepository<MerchantApiKey>
{
    Task<IEnumerable<MerchantApiKey>> GetActiveByMerchantIdAsync(Guid merchantId, CancellationToken cancellationToken = default);
    Task<MerchantApiKey?> GetByKeyAsync(string apiKey, CancellationToken cancellationToken = default);
}
