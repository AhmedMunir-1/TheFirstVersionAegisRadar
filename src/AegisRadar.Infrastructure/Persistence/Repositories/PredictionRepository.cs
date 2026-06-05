using AegisRadar.Domain.Entities;
using AegisRadar.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AegisRadar.Infrastructure.Persistence.Repositories;

public class PredictionRepository : Repository<Prediction>, IPredictionRepository
{
    public PredictionRepository(AegisRadarDbContext context)
        : base(context)
    {
    }

    public async Task<Prediction?> GetByTransactionIdAsync(Guid transactionId, CancellationToken cancellationToken = default)
    {
        return await Context.Predictions
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.TransactionId == transactionId, cancellationToken);
    }
}
