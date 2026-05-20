namespace AegisRadar.Domain.Entities;

public class TransactionHistory : BaseEntity
{
    public Guid TransactionId { get; set; }
    public double AmountRatio { get; set; }
    public int Hour { get; set; }
    public bool IsForeign { get; set; }
    public int UserDegree { get; set; }
    public int MerchantDegree { get; set; }
    public int Mcc { get; set; }
    public int UserFrequencyPerDay { get; set; }
    public double TimeDifferenceHours { get; set; }

    public Transaction Transaction { get; set; } = null!;
}
