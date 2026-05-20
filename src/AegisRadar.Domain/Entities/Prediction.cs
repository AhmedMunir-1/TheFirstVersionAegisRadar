using AegisRadar.Domain.Enums;

namespace AegisRadar.Domain.Entities;

public class Prediction : BaseEntity
{
    public Guid TransactionId { get; set; }
    public double FraudProbability { get; set; }
    public FraudDecision Decision { get; set; }
    public string ModelVersion { get; set; } = "1.0.0";

    public Transaction Transaction { get; set; } = null!;
}
