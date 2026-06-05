using AegisRadar.Domain.Entities;

namespace AegisRadar.Application.Interfaces;

public interface IDemoTransactionGenerator
{
    Task GenerateTransactionsForMerchantAsync(Merchant merchant, int count = 5, CancellationToken cancellationToken = default);
}
