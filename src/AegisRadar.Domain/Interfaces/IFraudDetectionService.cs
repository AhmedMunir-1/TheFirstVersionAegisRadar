using AegisRadar.Shared.DTOs;

namespace AegisRadar.Domain.Interfaces;

public interface IFraudDetectionService
{
    Task<FraudPredictionResultDto> PredictAsync(
        FraudFeaturePayloadDto features,
        CancellationToken cancellationToken = default);
}
