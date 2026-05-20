namespace AegisRadar.Application.DTOs;

public record TransactionRequestDto(
    string CustomerId,
    decimal Amount,
    string Currency,
    string Country,
    int Mcc,
    string DeviceId,
    string IpAddress
);

public record TransactionResponseDto(
    Guid Id,
    Guid MerchantId,
    string CustomerId,
    decimal Amount,
    string Currency,
    string Country,
    int Mcc,
    string Status,
    DateTime CreatedAt,
    PredictionResponseDto? Prediction
);

public record PredictionResponseDto(
    double FraudProbability,
    string Decision,
    string ModelVersion,
    DateTime CreatedAt
);
