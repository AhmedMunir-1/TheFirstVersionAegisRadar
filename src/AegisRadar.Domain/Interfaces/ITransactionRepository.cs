using AegisRadar.Domain.Entities;

namespace AegisRadar.Domain.Interfaces;

public interface ITransactionRepository : IRepository<Transaction>
{
    Task<Transaction?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Transaction>> GetByMerchantIdAsync(Guid merchantId, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<int> GetTodayCountByMerchantAsync(Guid merchantId, CancellationToken cancellationToken = default);
    Task<int> GetMonthlyCountByMerchantAsync(Guid merchantId, CancellationToken cancellationToken = default);
    Task<IEnumerable<Transaction>> GetFlaggedByMerchantAsync(Guid merchantId, CancellationToken cancellationToken = default);
    Task<double> GetAverageAmountByCustomerAsync(string customerId, CancellationToken cancellationToken = default);
    Task<int> GetUserDegreeAsync(string customerId, CancellationToken cancellationToken = default);
    Task<int> GetMerchantDegreeAsync(Guid merchantId, CancellationToken cancellationToken = default);
    Task<int> GetUserFrequencyTodayAsync(string customerId, CancellationToken cancellationToken = default);
    Task<DateTime?> GetLastTransactionTimeAsync(string customerId, CancellationToken cancellationToken = default);
    Task<IEnumerable<Transaction>> GetRecentByMerchantAsync(Guid merchantId, int count, CancellationToken cancellationToken = default);
}
