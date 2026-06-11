namespace AegisRadar.Shared.DTOs;

public class AnalyticsSummaryDto
{
    public int TotalTransactions { get; set; }
    public int TotalFraudulent { get; set; }
    public double FraudRate { get; set; }
    public double OverallRiskScore { get; set; }
    public int BlockedTransactions { get; set; }
    public int AvgResponseTimeMs { get; set; }
    
    public TrendsDto Trends { get; set; } = new();
    public List<object> TopRiskyMerchants { get; set; } = new();
    public List<HourlyDistributionDto> HourlyDistribution { get; set; } = new();
    
    public DateTime LastUpdated { get; set; }
}

public class TrendsDto
{
    public List<string> Labels { get; set; } = new();
    public List<double> FraudRate { get; set; } = new();
    public List<int> TransactionVolume { get; set; } = new();
}

public class HourlyDistributionDto
{
    public string Bucket { get; set; } = string.Empty;
    public int Count { get; set; }
    public double FraudRate { get; set; }
}
