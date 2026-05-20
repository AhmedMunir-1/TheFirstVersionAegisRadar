using AegisRadar.Domain.Entities;

namespace AegisRadar.Domain.Interfaces;

public interface ITransactionHistoryRepository : IRepository<TransactionHistory>
{
    Task<TransactionHistory?> GetByTransactionIdAsync(Guid transactionId, CancellationToken cancellationToken = default);
}
