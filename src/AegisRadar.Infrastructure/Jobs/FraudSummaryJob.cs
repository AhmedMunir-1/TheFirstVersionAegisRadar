using AegisRadar.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace AegisRadar.Infrastructure.Jobs;

public class FraudSummaryJob
{
    private readonly IUnitOfWork _uow;
    private readonly ILogger<FraudSummaryJob> _logger;

    public FraudSummaryJob(IUnitOfWork uow, ILogger<FraudSummaryJob> logger)
    {
        _uow    = uow;
        _logger = logger;
    }

    /// <summary>
    /// Runs daily — logs a fraud summary for each active merchant.
    /// Scheduled via Hangfire recurring job (cron: daily at midnight).
    /// </summary>
    public async Task ExecuteAsync()
    {
        _logger.LogInformation("FraudSummaryJob started at {Time}", DateTime.UtcNow);

        var merchants = await _uow.Merchants.GetAllAsync();
        foreach (var merchant in merchants)
        {
            var yesterday = DateTime.UtcNow.Date.AddDays(-1);
            var txns = await _uow.Transactions.GetByMerchantIdAsync(merchant.Id, 1, 10000);
            var dailyTxns = txns.Where(t => t.CreatedAt.Date == yesterday).ToList();

            _logger.LogInformation(
                "[DailySummary] Merchant={CompanyName} | Date={Date} | Total={Total} | Blocked={Blocked} | Review={Review} | Approved={Approved}",
                merchant.CompanyName,
                yesterday.ToString("yyyy-MM-dd"),
                dailyTxns.Count,
                dailyTxns.Count(t => t.Status == Domain.Enums.TransactionStatus.Blocked),
                dailyTxns.Count(t => t.Status == Domain.Enums.TransactionStatus.Review),
                dailyTxns.Count(t => t.Status == Domain.Enums.TransactionStatus.Approved));
        }

        _logger.LogInformation("FraudSummaryJob completed at {Time}", DateTime.UtcNow);
    }
}
