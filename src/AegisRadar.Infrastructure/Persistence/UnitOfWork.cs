using AegisRadar.Domain.Interfaces;
using AegisRadar.Infrastructure.Persistence.Repositories;

namespace AegisRadar.Infrastructure.Persistence;

public class UnitOfWork : IUnitOfWork
{
    private readonly AegisRadarDbContext _context;
    private bool _disposed;

    public ITransactionRepository Transactions { get; }
    public IPredictionRepository Predictions { get; }
    public IAlertRepository Alerts { get; }
    public IMerchantRepository Merchants { get; }
    public ITransactionHistoryRepository TransactionHistories { get; }
    public IPaymentRepository Payments { get; }

    public UnitOfWork(AegisRadarDbContext context)
    {
        _context             = context;
        Transactions         = new TransactionRepository(context);
        Predictions          = new PredictionRepository(context);
        Alerts               = new AlertRepository(context);
        Merchants            = new MerchantRepository(context);
        TransactionHistories = new TransactionHistoryRepository(context);
        Payments             = new PaymentRepository(context);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => await _context.SaveChangesAsync(cancellationToken);

    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed && disposing) _context.Dispose();
        _disposed = true;
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }
}
