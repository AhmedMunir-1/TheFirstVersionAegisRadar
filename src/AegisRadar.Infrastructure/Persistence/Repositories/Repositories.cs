using AegisRadar.Domain.Entities;
using AegisRadar.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AegisRadar.Infrastructure.Persistence.Repositories;

public class BaseRepository<T> : IRepository<T> where T : class
{
    protected readonly AegisRadarDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public BaseRepository(AegisRadarDbContext context)
    {
        _context = context;
        _dbSet   = context.Set<T>();
    }

    public async Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await _dbSet.FindAsync([id], cancellationToken);

    public async Task<IEnumerable<T>> GetAllAsync(CancellationToken cancellationToken = default)
        => await _dbSet.ToListAsync(cancellationToken);

    public async Task AddAsync(T entity, CancellationToken cancellationToken = default)
        => await _dbSet.AddAsync(entity, cancellationToken);

    public void Update(T entity) => _dbSet.Update(entity);
    public void Remove(T entity) => _dbSet.Remove(entity);
}

// ─── Transaction Repository ──────────────────────────────────────────────────
public class TransactionRepository : BaseRepository<Transaction>, ITransactionRepository
{
    public TransactionRepository(AegisRadarDbContext context) : base(context) { }

    public async Task<Transaction?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
        => await _context.Transactions
            .Include(t => t.Prediction)
            .Include(t => t.Merchant)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

    public async Task<IEnumerable<Transaction>> GetByMerchantIdAsync(Guid merchantId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        int validPage = page < 1 ? 1 : page;
        return await _context.Transactions
            .Include(t => t.Prediction)
            .Where(t => t.MerchantId == merchantId)
            .OrderByDescending(t => t.CreatedAt)
            .Skip((validPage - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetTodayCountByMerchantAsync(Guid merchantId, CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;
        return await _context.Transactions
            .CountAsync(t => t.MerchantId == merchantId && t.CreatedAt >= today, cancellationToken);
    }

    public async Task<int> GetMonthlyCountByMerchantAsync(Guid merchantId, CancellationToken cancellationToken = default)
    {
        var start = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        return await _context.Transactions
            .CountAsync(t => t.MerchantId == merchantId && t.CreatedAt >= start, cancellationToken);
    }

    public async Task<IEnumerable<Transaction>> GetFlaggedByMerchantAsync(Guid merchantId, CancellationToken cancellationToken = default)
        => await _context.Transactions
            .Include(t => t.Prediction)
            .Where(t => t.MerchantId == merchantId &&
                        (t.Status == Domain.Enums.TransactionStatus.Review ||
                         t.Status == Domain.Enums.TransactionStatus.Blocked))
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<double> GetAverageAmountByCustomerAsync(string customerId, CancellationToken cancellationToken = default)
    {
        var avg = await _context.Transactions
            .Where(t => t.CustomerId == customerId)
            .AverageAsync(t => (double?)t.Amount, cancellationToken);
        return avg ?? 0;
    }

    public async Task<int> GetUserDegreeAsync(string customerId, CancellationToken cancellationToken = default)
        => await _context.Transactions
            .Where(t => t.CustomerId == customerId)
            .Select(t => t.MerchantId)
            .Distinct()
            .CountAsync(cancellationToken);

    public async Task<int> GetMerchantDegreeAsync(Guid merchantId, CancellationToken cancellationToken = default)
        => await _context.Transactions
            .Where(t => t.MerchantId == merchantId)
            .Select(t => t.CustomerId)
            .Distinct()
            .CountAsync(cancellationToken);

    public async Task<int> GetUserFrequencyTodayAsync(string customerId, CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;
        return await _context.Transactions
            .CountAsync(t => t.CustomerId == customerId && t.CreatedAt >= today, cancellationToken);
    }

    public async Task<DateTime?> GetLastTransactionTimeAsync(string customerId, CancellationToken cancellationToken = default)
        => await _context.Transactions
            .Where(t => t.CustomerId == customerId)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => (DateTime?)t.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<IEnumerable<Transaction>> GetRecentByMerchantAsync(Guid merchantId, int count, CancellationToken cancellationToken = default)
        => await _context.Transactions
            .Include(t => t.Prediction)
            .Where(t => t.MerchantId == merchantId)
            .OrderByDescending(t => t.CreatedAt)
            .Take(count)
            .ToListAsync(cancellationToken);
}

// ─── Prediction Repository ───────────────────────────────────────────────────
public class PredictionRepository : BaseRepository<Prediction>, IPredictionRepository
{
    public PredictionRepository(AegisRadarDbContext context) : base(context) { }

    public async Task<Prediction?> GetByTransactionIdAsync(Guid transactionId, CancellationToken cancellationToken = default)
        => await _context.Predictions.FirstOrDefaultAsync(p => p.TransactionId == transactionId, cancellationToken);
}

// ─── Alert Repository ────────────────────────────────────────────────────────
public class AlertRepository : BaseRepository<Alert>, IAlertRepository
{
    public AlertRepository(AegisRadarDbContext context) : base(context) { }

    public async Task<IEnumerable<Alert>> GetByMerchantIdAsync(Guid merchantId, bool unreadOnly = false, CancellationToken cancellationToken = default)
    {
        var query = _context.Alerts.Where(a => a.MerchantId == merchantId);
        if (unreadOnly) query = query.Where(a => !a.IsRead);
        return await query.OrderByDescending(a => a.CreatedAt).ToListAsync(cancellationToken);
    }

    public async Task<int> GetUnreadCountAsync(Guid merchantId, CancellationToken cancellationToken = default)
        => await _context.Alerts.CountAsync(a => a.MerchantId == merchantId && !a.IsRead, cancellationToken);
}

// ─── Merchant Repository ─────────────────────────────────────────────────────
public class MerchantRepository : BaseRepository<Merchant>, IMerchantRepository
{
    public MerchantRepository(AegisRadarDbContext context) : base(context) { }

    public async Task<Merchant?> GetByApiKeyAsync(string apiKey, CancellationToken cancellationToken = default)
        => await _context.Merchants.Include(m => m.Plan).FirstOrDefaultAsync(m => m.ApiKey == apiKey, cancellationToken);

    public async Task<Merchant?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
        => await _context.Merchants.Include(m => m.Plan).FirstOrDefaultAsync(m => m.Email == email, cancellationToken);

    public async Task<bool> ApiKeyExistsAsync(string apiKey, CancellationToken cancellationToken = default)
        => await _context.Merchants.AnyAsync(m => m.ApiKey == apiKey, cancellationToken);
}

// ─── TransactionHistory Repository ──────────────────────────────────────────
public class TransactionHistoryRepository : BaseRepository<TransactionHistory>, ITransactionHistoryRepository
{
    public TransactionHistoryRepository(AegisRadarDbContext context) : base(context) { }

    public async Task<TransactionHistory?> GetByTransactionIdAsync(Guid transactionId, CancellationToken cancellationToken = default)
        => await _context.TransactionHistories.FirstOrDefaultAsync(h => h.TransactionId == transactionId, cancellationToken);
}
