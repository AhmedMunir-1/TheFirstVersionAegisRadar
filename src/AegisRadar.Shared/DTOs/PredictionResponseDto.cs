namespace AegisRadar.Shared.DTOs;

public class PredictionResponseDto
{
    public double FraudProbability { get; set; }
    public string Decision { get; set; } = string.Empty;
    public string ModelVersion { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public double AmountRatio { get; set; }
    public int Hour { get; set; }
    public bool IsForeign { get; set; }
    public int UserDegree { get; set; }
    public int MerchantDegree { get; set; }
    public double UserFrequencyPerDay { get; set; }
    public double TimeDifferenceHours { get; set; }
}
