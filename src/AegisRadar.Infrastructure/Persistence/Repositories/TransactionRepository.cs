using AegisRadar.Domain.Entities;
using AegisRadar.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AegisRadar.Infrastructure.Persistence.Repositories;

public class TransactionRepository : Repository<Transaction>, ITransactionRepository
{
    public TransactionRepository(AegisRadarDbContext context)
        : base(context)
    {
    }

    public async Task<Transaction?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await Context.Transactions
            .Include(t => t.Prediction)
            .Include(t => t.History)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<Transaction>> GetByMerchantIdAsync(Guid merchantId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        return await Context.Transactions
            .Where(t => t.MerchantId == merchantId)
            .Include(t => t.Prediction)
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetTodayCountByMerchantAsync(Guid merchantId, CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;
        return await Context.Transactions
            .CountAsync(t => t.MerchantId == merchantId && t.CreatedAt >= today, cancellationToken);
    }

    public async Task<int> GetMonthlyCountByMerchantAsync(Guid merchantId, CancellationToken cancellationToken = default)
    {
        var firstDayOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        return await Context.Transactions
            .CountAsync(t => t.MerchantId == merchantId && t.CreatedAt >= firstDayOfMonth, cancellationToken);
    }

    public async Task<IEnumerable<Transaction>> GetFlaggedByMerchantAsync(Guid merchantId, CancellationToken cancellationToken = default)
    {
        return await Context.Transactions
            .Where(t => t.MerchantId == merchantId && t.Status != Domain.Enums.TransactionStatus.Approved)
            .OrderByDescending(t => t.CreatedAt)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<double> GetAverageAmountByCustomerAsync(string customerId, CancellationToken cancellationToken = default)
    {
        return await Context.Transactions
            .Where(t => t.CustomerId == customerId)
            .AverageAsync(t => (double)t.Amount, cancellationToken);
    }

    public async Task<int> GetUserDegreeAsync(string customerId, CancellationToken cancellationToken = default)
    {
        return await Context.Transactions
            .CountAsync(t => t.CustomerId == customerId, cancellationToken);
    }

    public async Task<int> GetMerchantDegreeAsync(Guid merchantId, CancellationToken cancellationToken = default)
    {
        return await Context.Transactions
            .CountAsync(t => t.MerchantId == merchantId, cancellationToken);
    }

    public async Task<int> GetUserFrequencyTodayAsync(string customerId, CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;
        return await Context.Transactions
            .CountAsync(t => t.CustomerId == customerId && t.CreatedAt >= today, cancellationToken);
    }

    public async Task<DateTime?> GetLastTransactionTimeAsync(string customerId, CancellationToken cancellationToken = default)
    {
        return await Context.Transactions
            .Where(t => t.CustomerId == customerId)
            .MaxAsync(t => (DateTime?)t.CreatedAt, cancellationToken);
    }

    public async Task<IEnumerable<Transaction>> GetRecentByMerchantAsync(Guid merchantId, int count, CancellationToken cancellationToken = default)
    {
        return await Context.Transactions
            .Where(t => t.MerchantId == merchantId)
            .Include(t => t.Prediction)
            .OrderByDescending(t => t.CreatedAt)
            .Take(count)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Transaction>> GetByMerchantIdInRangeAsync(
        Guid merchantId, 
        DateTime startDate, 
        DateTime endDate, 
        CancellationToken cancellationToken = default)
    {
        return await Context.Transactions
            .Where(t => t.MerchantId == merchantId && t.CreatedAt >= startDate && t.CreatedAt < endDate)
            .Include(t => t.Prediction)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }
}
