namespace AegisRadar.Shared.DTOs;

/// <summary>
/// Response from FastAPI fraud detection service
/// </summary>
public class FraudPredictionResultDto
{
    public double fraud_probability { get; set; }
    public string decision { get; set; } = "approved"; // "approved" | "review" | "blocked"

    public FraudPredictionResultDto() { }

    public FraudPredictionResultDto(double fraudProbability, string decision)
    {
        fraud_probability = fraudProbability;
        this.decision = decision;
    }
}
