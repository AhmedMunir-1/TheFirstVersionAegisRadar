using AegisRadar.Domain.Entities;

namespace AegisRadar.Domain.Interfaces;

public interface IPredictionRepository : IRepository<Prediction>
{
    Task<Prediction?> GetByTransactionIdAsync(Guid transactionId, CancellationToken cancellationToken = default);
}
