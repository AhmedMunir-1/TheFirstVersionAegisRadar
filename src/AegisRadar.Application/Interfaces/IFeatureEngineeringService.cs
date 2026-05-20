using AegisRadar.Application.DTOs;

namespace AegisRadar.Application.Interfaces;

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
