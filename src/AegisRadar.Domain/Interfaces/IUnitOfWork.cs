namespace AegisRadar.Domain.Interfaces;

public interface IUnitOfWork : IDisposable
{
    ITransactionRepository Transactions { get; }
    IPredictionRepository Predictions { get; }
    IAlertRepository Alerts { get; }
    IMerchantRepository Merchants { get; }
    ITransactionHistoryRepository TransactionHistories { get; }
    IPaymentRepository Payments { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
