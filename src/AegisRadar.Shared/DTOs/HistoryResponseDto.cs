namespace AegisRadar.Shared.DTOs;

public class HistoryResponseDto
{
    public List<HistoryTransactionDto> Transactions { get; set; } = new();
    public int Total { get; set; }
    public int FraudCount { get; set; }
    public int ReviewCount { get; set; }
    public decimal TotalAmount { get; set; }
}

public class HistoryTransactionDto : TransactionResponseDto
{
    public string RiskLevel { get; set; } = "LOW";  // HIGH, MEDIUM, LOW
}
