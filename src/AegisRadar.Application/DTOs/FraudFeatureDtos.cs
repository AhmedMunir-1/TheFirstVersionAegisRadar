namespace AegisRadar.Application.DTOs;

public record FraudFeaturePayloadDto(
    double AmountRatio,
    int Hour,
    int IsForeign,
    int UserDegree,
    int MerchantDegree,
    int MCC,
    int UserFrequencyPerDay,
    double TimeDifferenceHours
);

public record FraudPredictionResultDto(
    double FraudProbability,
    string Decision
);
