using AegisRadar.Shared.DTOs;

namespace AegisRadar.Domain.Interfaces;

public interface IFeatureEngineeringService
{
    Task<FraudFeaturePayloadDto> ComputeFeaturesAsync(
        Guid merchantId,
        string customerId,
        decimal amount,
        string transactionCountry,
        string merchantCountry,
        int mcc,
        DateTime transactionTime,
        CancellationToken cancellationToken = default);
}
