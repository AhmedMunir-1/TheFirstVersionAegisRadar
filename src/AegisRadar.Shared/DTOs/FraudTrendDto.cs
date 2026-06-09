namespace AegisRadar.Shared.DTOs;

public class FraudTrendDto
{
    public DateTime Date { get; set; }
    public int Count { get; set; }
    public int TransactionCount { get; set; }
    public int FraudCount { get; set; }
    public decimal TotalAmount { get; set; }
    public double Percentage { get; set; }
    public double AvgFraudProbability { get; set; }
}
