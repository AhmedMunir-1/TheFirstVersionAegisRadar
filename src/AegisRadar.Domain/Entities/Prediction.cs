using AegisRadar.Domain.Enums;

namespace AegisRadar.Domain.Entities;

public class Prediction : BaseEntity
{
    public Guid TransactionId { get; set; }
    public double FraudProbability { get; set; }
    public FraudDecision Decision { get; set; }
    public string ModelVersion { get; set; } = "1.0.0";
    public bool AdminOverride { get; set; } = false;
    public string? AdminNote { get; set; }
    public DateTime? ReviewedAt { get; set; }

    // ML Features (for audit and admin review detail view)
    public double? AmountRatio { get; set; }
    public int? Hour { get; set; }
    public bool? IsForeign { get; set; }
    public int? UserDegree { get; set; }
    public int? MerchantDegree { get; set; }
    public int? UserFrequencyPerDay { get; set; }
    public int? TimeDifferenceHours { get; set; }

    public Transaction Transaction { get; set; } = null!;
}
