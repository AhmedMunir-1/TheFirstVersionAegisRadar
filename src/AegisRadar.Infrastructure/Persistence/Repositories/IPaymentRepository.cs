using AegisRadar.Domain.Entities;
using AegisRadar.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AegisRadar.Infrastructure.Persistence.Repositories;

public class PaymentRepository : BaseRepository<Payment>, AegisRadar.Domain.Interfaces.IPaymentRepository
{
    public PaymentRepository(AegisRadarDbContext context) : base(context) { }

    public async Task<Payment?> GetByReferenceAsync(string reference, CancellationToken cancellationToken = default)
        => await _context.Payments
            .Include(p => p.Plan)
            .FirstOrDefaultAsync(p => p.TransactionReference == reference, cancellationToken);

    public async Task<IEnumerable<Payment>> GetByMerchantAsync(Guid merchantId, CancellationToken cancellationToken = default)
        => await _context.Payments
            .Include(p => p.Plan)
            .Where(p => p.MerchantId == merchantId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<IEnumerable<Payment>> GetPendingPaymentsAsync(CancellationToken cancellationToken = default)
        => await _context.Payments
            .Where(p => p.Status.ToString() == "Pending")
            .ToListAsync(cancellationToken);
}
