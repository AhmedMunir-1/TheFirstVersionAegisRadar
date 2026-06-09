namespace AegisRadar.Infrastructure.DTOs;

/// <summary>
/// 8 engineered fraud detection features for AI API
/// </summary>
public record FraudFeaturePayloadDto(
    double AmountRatio,
    int Hour,
    int IsForeign,
    int UserDegree,
    int MerchantDegree,
    int MCC,
    int UserFrequencyPerDay,
    double TimeDifferenceHours);
