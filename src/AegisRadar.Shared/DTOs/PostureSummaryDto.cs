namespace AegisRadar.Shared.DTOs;

public class PostureSummaryDto
{
    public int FraudPrevention { get; set; }
    public int AuthStrength { get; set; }
    public int ModelAccuracy { get; set; }
    public int ResponseCoverage { get; set; }
    public int PolicyCompliance { get; set; }
    public double OverallScore { get; set; }
    
    public List<QuickStatDto> QuickStats { get; set; } = new();
    public List<RiskCardDto> RiskCards { get; set; } = new();
    public List<InsightDto> Insights { get; set; } = new();
    public List<ThreatDto> Threats { get; set; } = new();
    public List<RecommendationDto> Recommendations { get; set; } = new();
    public List<int> Trend { get; set; } = new();
    
    public string ReportPeriod { get; set; } = "Last 30 days";
    public string Business { get; set; } = string.Empty;
    public DateTime LastScan { get; set; }
}

public class QuickStatDto
{
    public string Label { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

public class RiskCardDto
{
    public string Label { get; set; } = string.Empty;
    public int Score { get; set; }
    public string Icon { get; set; } = string.Empty;
    public string Detail { get; set; } = string.Empty;
}

public class InsightDto
{
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
}

public class ThreatDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Count { get; set; }
    public int Delta { get; set; }
    public string Severity { get; set; } = "MEDIUM";
    public DateTime LastSeen { get; set; }
}

public class RecommendationDto
{
    public string Priority { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Effort { get; set; } = string.Empty;
}
