using AegisRadar.Shared.DTOs;
using AegisRadar.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace AegisRadar.Infrastructure.Services;

public class FeatureEngineeringService : IFeatureEngineeringService
{
    private readonly IUnitOfWork _uow;
    private readonly ILogger<FeatureEngineeringService> _logger;

    public FeatureEngineeringService(IUnitOfWork uow, ILogger<FeatureEngineeringService> logger)
    {
        _uow    = uow;
        _logger = logger;
    }

    public async Task<FraudFeaturePayloadDto> ComputeFeaturesAsync(
        Guid merchantId,
        string customerId,
        decimal amount,
        string transactionCountry,
        string merchantCountry,
        int mcc,
        DateTime transactionTime,
        CancellationToken cancellationToken = default)
    {
        // 1. amount_ratio = current / avg_user_amount
        var avgAmount   = await _uow.Transactions.GetAverageAmountByCustomerAsync(customerId, cancellationToken);
        var amountRatio = avgAmount > 0 ? (double)amount / avgAmount : 1.0;

        // 2. Hour extracted from timestamp
        var hour = transactionTime.Hour;

        // 3. is_foreign = 1 if tx country != merchant country
        var isForeign = transactionCountry.Equals(merchantCountry, StringComparison.OrdinalIgnoreCase) ? 0 : 1;

        // 4. user_degree = distinct merchants used by customer
        var userDegree = await _uow.Transactions.GetUserDegreeAsync(customerId, cancellationToken);

        // 5. merchant_degree = distinct customers for this merchant
        var merchantDegree = await _uow.Transactions.GetMerchantDegreeAsync(merchantId, cancellationToken);

        // 6. MCC comes directly from the request (already provided)

        // 7. user_frequency_per_day = tx count today for this user
        var userFrequencyPerDay = await _uow.Transactions.GetUserFrequencyTodayAsync(customerId, cancellationToken);

        // 8. time_difference_hours = hours since last transaction
        var lastTxTime       = await _uow.Transactions.GetLastTransactionTimeAsync(customerId, cancellationToken);
        var timeDiffHours    = lastTxTime.HasValue
            ? (transactionTime - lastTxTime.Value).TotalHours
            : 999.0; // No prior transaction → large gap

        _logger.LogDebug(
            "Features for customer {CustomerId}: amountRatio={AmountRatio:F2}, hour={Hour}, isForeign={IsForeign}, " +
            "userDegree={UserDegree}, merchantDegree={MerchantDegree}, mcc={MCC}, " +
            "freqPerDay={FreqPerDay}, timeDiff={TimeDiff:F2}h",
            customerId, amountRatio, hour, isForeign, userDegree, merchantDegree, mcc, userFrequencyPerDay, timeDiffHours);

        return new FraudFeaturePayloadDto(
            AmountRatio:          Math.Round(amountRatio, 4),
            Hour:                 hour,
            IsForeign:            isForeign,
            UserDegree:           userDegree,
            MerchantDegree:       merchantDegree,
            MCC:                  mcc,
            UserFrequencyPerDay:  userFrequencyPerDay,
            TimeDifferenceHours:  Math.Round(timeDiffHours, 4));
    }
}
