namespace AegisRadar.Shared.DTOs;

public class DashboardStatsDto
{
    public int TotalTransactions { get; set; }
    public int FraudulentCount { get; set; }
    public int ReviewCount { get; set; }
    public int ApprovedCount { get; set; }
    public int BlockedCount { get; set; }
    public int PendingReviewCount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal TotalAmountToday { get; set; }
    public int TotalTransactionsToday { get; set; }
    public double FraudRate { get; set; }
    public double FraudRateToday { get; set; }
}
