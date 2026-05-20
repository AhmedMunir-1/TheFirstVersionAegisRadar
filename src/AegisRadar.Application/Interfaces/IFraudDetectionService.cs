using AegisRadar.Application.DTOs;

namespace AegisRadar.Application.Interfaces;

public interface IFraudDetectionService
{
    Task<FraudPredictionResultDto> PredictAsync(FraudFeaturePayloadDto features, CancellationToken cancellationToken = default);
}
