using AegisRadar.Domain.Entities;

namespace AegisRadar.Domain.Interfaces;

public interface IDemoTransactionGenerator
{
    Task GenerateTransactionsForMerchantAsync(Merchant merchant, int count, CancellationToken cancellationToken = default);
}
