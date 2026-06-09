using AegisRadar.Domain.Interfaces;

namespace AegisRadar.Infrastructure.Persistence.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AegisRadarDbContext _context;

    public UnitOfWork(AegisRadarDbContext context)
    {
        _context = context;
        Transactions = new TransactionRepository(context);
        Predictions = new PredictionRepository(context);
        Alerts = new AlertRepository(context);
        Merchants = new MerchantRepository(context);
        TransactionHistories = new TransactionHistoryRepository(context);
    }

    public ITransactionRepository Transactions { get; }
    public IPredictionRepository Predictions { get; }
    public IAlertRepository Alerts { get; }
    public IMerchantRepository Merchants { get; }
    public ITransactionHistoryRepository TransactionHistories { get; }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _context.SaveChangesAsync(cancellationToken);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
