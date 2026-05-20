using AegisRadar.Domain.Entities;

namespace AegisRadar.Domain.Interfaces;

public interface IMerchantRepository : IRepository<Merchant>
{
    Task<Merchant?> GetByApiKeyAsync(string apiKey, CancellationToken cancellationToken = default);
    Task<Merchant?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<bool> ApiKeyExistsAsync(string apiKey, CancellationToken cancellationToken = default);
}
