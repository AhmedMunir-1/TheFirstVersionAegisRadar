using AegisRadar.Domain.Entities;
using AegisRadar.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AegisRadar.Infrastructure.Persistence.Repositories;

public class TransactionHistoryRepository : Repository<TransactionHistory>, ITransactionHistoryRepository
{
    public TransactionHistoryRepository(AegisRadarDbContext context)
        : base(context)
    {
    }

    public async Task<TransactionHistory?> GetByTransactionIdAsync(Guid transactionId, CancellationToken cancellationToken = default)
    {
        return await Context.TransactionHistories
            .AsNoTracking()
            .FirstOrDefaultAsync(th => th.TransactionId == transactionId, cancellationToken);
    }
}
