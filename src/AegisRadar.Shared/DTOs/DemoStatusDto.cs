namespace AegisRadar.Shared.DTOs;

public class DemoStatusDto
{
    public string Status { get; set; } = "online";
    public string ModelVersion { get; set; } = "ensemble-v2.2";
    public double Accuracy { get; set; } = 96.3;
    public int TotalTransactions { get; set; }
    public int AvgResponseMs { get; set; } = 38;
    public int FraudDetectedToday { get; set; }
    public string LastTrained { get; set; } = "Jun 3 2026";
    public double ServerUptime { get; set; } = 98.5;
}

public class DemoTransactionDto
{
    public string TransactionId { get; set; } = string.Empty;
    public string Merchant { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime Timestamp { get; set; }
    public int Velocity1h { get; set; }
    public int Velocity24h { get; set; }
    public string MerchantCategory { get; set; } = string.Empty;
}

public class BatchTestResponseDto
{
    public List<DemoTransactionDto> Transactions { get; set; } = new();
}
