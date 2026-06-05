using AegisRadar.Application.Interfaces;
using AegisRadar.Domain.Entities;
using AegisRadar.Domain.Enums;
using AegisRadar.Domain.Interfaces;
using AegisRadar.Shared.Events;

namespace AegisRadar.Infrastructure.Services;

public class DemoTransactionGenerator : IDemoTransactionGenerator
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IKafkaProducer _kafkaProducer;
    private readonly Random _random;

    public DemoTransactionGenerator(IUnitOfWork unitOfWork, IKafkaProducer kafkaProducer)
    {
        _unitOfWork = unitOfWork;
        _kafkaProducer = kafkaProducer;
        _random = new Random();
    }

    public async Task GenerateTransactionsForMerchantAsync(Merchant merchant, int count = 5, CancellationToken cancellationToken = default)
    {
        if (merchant == null || merchant.Role != "Admin")
            return;

        var existingTransactions = await _unitOfWork.Transactions.GetByMerchantIdAsync(merchant.Id, 1, 20, cancellationToken);
        if (existingTransactions.Any(t => t.CreatedAt.Date == DateTime.UtcNow.Date))
            return;

        var transactions = new List<Transaction>();
        var mccOptions = new[] { 5411, 5812, 4829, 6011, 7995 };
        var sampleCountries = new[] { merchant.Country, "US", "GB", "AE", "CA" };

        for (var i = 0; i < count; i++)
        {
            var amount = Math.Round(_random.NextDouble() * 4900 + 100, 2);
            var country = sampleCountries[_random.Next(sampleCountries.Length)];

            var transaction = new Transaction
            {
                MerchantId = merchant.Id,
                CustomerId = $"cust_{_random.Next(1000, 9999)}",
                Amount = (decimal)amount,
                Currency = "EGP",
                Country = country,
                Mcc = mccOptions[_random.Next(mccOptions.Length)],
                DeviceId = $"device_{_random.Next(10000, 99999)}",
                IpAddress = $"{_random.Next(1, 255)}.{_random.Next(0, 255)}.{_random.Next(0, 255)}.{_random.Next(1, 255)}",
                CreatedAt = DateTime.UtcNow,
                Status = TransactionStatus.Pending
            };

            await _unitOfWork.Transactions.AddAsync(transaction, cancellationToken);
            transactions.Add(transaction);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        foreach (var transaction in transactions)
        {
            var transactionEvent = new TransactionCreatedEvent
            {
                TransactionId = transaction.Id,
                MerchantId = transaction.MerchantId,
                CustomerId = transaction.CustomerId,
                Amount = transaction.Amount,
                Currency = transaction.Currency,
                TransactionCountry = transaction.Country,
                MerchantCountry = merchant.Country,
                Mcc = transaction.Mcc,
                DeviceId = transaction.DeviceId,
                IpAddress = transaction.IpAddress,
                CreatedAt = transaction.CreatedAt
            };

            await _kafkaProducer.PublishTransactionCreatedAsync(transactionEvent, cancellationToken);
        }
    }
}
