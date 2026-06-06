using AegisRadar.Application.Features.Transactions.Commands;
using AegisRadar.Application.DTOs;
using AegisRadar.Domain.Entities;
using AegisRadar.Domain.Interfaces;
using AegisRadar.Shared.Events;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AegisRadar.Worker.Services;

/// <summary>
/// Background service that automatically generates demo transactions
/// at regular intervals for testing real-time fraud detection.
/// </summary>
public class DemoTransactionGeneratorService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<DemoTransactionGeneratorService> _logger;
    private readonly TimeSpan _generationInterval = TimeSpan.FromSeconds(30); // Generate every 30 seconds
    private readonly int _transactionsPerBatch = 5; // Generate 5 transactions per batch

    public DemoTransactionGeneratorService(
        IServiceScopeFactory scopeFactory,
        ILogger<DemoTransactionGeneratorService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "DemoTransactionGeneratorService starting. Will generate {Count} transactions every {Interval} seconds",
            _transactionsPerBatch, _generationInterval.TotalSeconds);

        // Wait for system to stabilize
        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await GenerateDemoTransactionsAsync(stoppingToken);
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating demo transactions");
            }

            // Wait for next batch
            await Task.Delay(_generationInterval, stoppingToken);
        }

        _logger.LogInformation("DemoTransactionGeneratorService stopped.");
    }

    private async Task GenerateDemoTransactionsAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var uow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
        var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();

        try
        {
            // Get a demo merchant to use for transaction generation
            // In production, this could be configurable or iterate through multiple merchants
            var merchants = await uow.Merchants.GetAllAsync(ct);
            var demoMerchant = merchants.FirstOrDefault();

            if (demoMerchant is null)
            {
                _logger.LogWarning("No merchants found. Skipping demo transaction generation.");
                return;
            }

            var random = new Random();
            var currencies = new[] { "USD", "EUR", "GBP", "JPY", "AED" };
            var countries = new[] { "US", "UK", "DE", "FR", "JP", "EG", "AE" };
            var mccs = new[] { 5411, 5412, 5691, 5999, 6010, 6211, 7011 };

            var merchantCountry = demoMerchant.Country ?? "EG";
            var created = 0;

            for (int i = 0; i < _transactionsPerBatch; i++)
            {
                try
                {
                    var request = new TransactionRequestDto(
                        CustomerId: $"DEMO-{Guid.NewGuid().ToString().Substring(0, 8)}",
                        Amount: (decimal)(random.NextDouble() * 5000 + 10),
                        Currency: currencies[random.Next(currencies.Length)],
                        Country: countries[random.Next(countries.Length)],
                        Mcc: mccs[random.Next(mccs.Length)],
                        DeviceId: Guid.NewGuid().ToString(),
                        IpAddress: $"192.168.{random.Next(256)}.{random.Next(256)}"
                    );

                    var command = new SubmitTransactionCommand(demoMerchant.Id, merchantCountry, request);
                    await mediator.Send(command, ct);
                    created++;

                    // Small delay to spread out Kafka events
                    await Task.Delay(50, ct);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to generate demo transaction {Index}", i);
                }
            }

            if (created > 0)
            {
                _logger.LogInformation("✨ Generated {Count} demo transactions for merchant {MerchantId}",
                    created, demoMerchant.Id);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GenerateDemoTransactionsAsync");
        }
    }
}
