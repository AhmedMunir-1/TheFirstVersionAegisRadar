using AegisRadar.Domain.Entities;
using AegisRadar.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AegisRadar.Infrastructure.Persistence.Repositories;

public class PaymentRepository : Repository<Payment>, IPaymentRepository
{
    public PaymentRepository(AegisRadarDbContext context)
        : base(context)
    {
    }

    public async Task<Payment?> GetByReferenceAsync(string reference, CancellationToken cancellationToken = default)
    {
        return await Context.Payments
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.TransactionReference == reference, cancellationToken);
    }

    public async Task<IEnumerable<Payment>> GetByMerchantAsync(Guid merchantId, CancellationToken cancellationToken = default)
    {
        return await Context.Payments
            .Where(p => p.MerchantId == merchantId)
            .OrderByDescending(p => p.CreatedAt)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Payment>> GetPendingPaymentsAsync(CancellationToken cancellationToken = default)
    {
        return await Context.Payments
            .Where(p => p.Status == Domain.Enums.PaymentStatus.Pending)
            .OrderBy(p => p.CreatedAt)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }
}
