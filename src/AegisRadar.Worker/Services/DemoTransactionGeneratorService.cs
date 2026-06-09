using AegisRadar.Domain.Interfaces;
using AegisRadar.Infrastructure.Services;
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
    private readonly TimeSpan _generationInterval = TimeSpan.FromSeconds(1);

    public DemoTransactionGeneratorService(
        IServiceScopeFactory scopeFactory,
        ILogger<DemoTransactionGeneratorService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("DemoTransactionGeneratorService starting. Generating transactions automatically.");

        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await GenerateDemoTransactionsAsync(stoppingToken);
                await Task.Delay(_generationInterval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating demo transaction");
                await Task.Delay(_generationInterval, stoppingToken);
            }
        }

        _logger.LogInformation("DemoTransactionGeneratorService stopped.");
    }

    private async Task GenerateDemoTransactionsAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var uow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
        var generator = scope.ServiceProvider.GetRequiredService<IDemoTransactionGenerator>();

        var merchants = await uow.Merchants.GetAllAsync(ct);
        var demoMerchant = merchants.FirstOrDefault();
        if (demoMerchant is null)
        {
            _logger.LogWarning("No merchants found. Skipping demo transaction generation.");
            return;
        }

        await generator.GenerateTransactionsForMerchantAsync(demoMerchant, 1, ct);
    }
}
