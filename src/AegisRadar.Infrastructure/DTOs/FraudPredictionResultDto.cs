namespace AegisRadar.Infrastructure.DTOs;

/// <summary>
/// Response from FastAPI fraud detection service
/// </summary>
public class FraudPredictionResultDto
{
    public double fraud_probability { get; set; }
    public string decision { get; set; } = "approved"; // "approved" | "review" | "blocked"
}
