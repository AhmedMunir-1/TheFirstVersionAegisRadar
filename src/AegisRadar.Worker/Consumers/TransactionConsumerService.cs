using AegisRadar.Application.DTOs;
using AegisRadar.Application.Interfaces;
using AegisRadar.Domain.Entities;
using AegisRadar.Domain.Enums;
using AegisRadar.Domain.Interfaces;
using AegisRadar.Shared.Constants;
using AegisRadar.Shared.Events;
using Confluent.Kafka;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace AegisRadar.Worker.Consumers;

public class TransactionConsumerService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TransactionConsumerService> _logger;
    private readonly ConsumerConfig _consumerConfig;
    private readonly string _topic;
    private readonly string _signalRHubUrl;

    public TransactionConsumerService(
        IServiceScopeFactory scopeFactory,
        ILogger<TransactionConsumerService> logger,
        IOptions<AegisRadar.Infrastructure.Kafka.KafkaSettings> kafkaOptions,
        IConfiguration configuration)
    {
        _scopeFactory = scopeFactory;
        _logger       = logger;
        _topic        = kafkaOptions.Value.TransactionsTopic;
        _signalRHubUrl = configuration["SignalR:HubUrl"] ?? "http://aegisradar-api:5000/hubs/fraud-alerts";

        _consumerConfig = new ConsumerConfig
        {
            BootstrapServers  = kafkaOptions.Value.BootstrapServers,
            GroupId           = kafkaOptions.Value.GroupId,
            AutoOffsetReset   = AutoOffsetReset.Earliest,
            EnableAutoCommit  = false,
            SessionTimeoutMs  = 30000,
            MaxPollIntervalMs = 300000
        };
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("TransactionConsumerService starting. Topic={Topic}", _topic);

        // Wait for Kafka to be ready
        await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);

        using var consumer = new ConsumerBuilder<string, string>(_consumerConfig)
            .SetErrorHandler((_, e) => _logger.LogError("Kafka consumer error: {Reason}", e.Reason))
            .SetPartitionsAssignedHandler((c, partitions) =>
                _logger.LogInformation("Partitions assigned: {Partitions}", string.Join(",", partitions)))
            .Build();

        consumer.Subscribe(_topic);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var result = consumer.Consume(TimeSpan.FromSeconds(1));
                if (result?.Message?.Value is null) continue;

                var evt = JsonSerializer.Deserialize<TransactionCreatedEvent>(result.Message.Value);
                if (evt is null) continue;

                _logger.LogInformation("Consumed TransactionCreatedEvent {TransactionId}", evt.TransactionId);

                await ProcessTransactionAsync(evt, stoppingToken);
                consumer.Commit(result);
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing Kafka message");
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }

        consumer.Close();
        _logger.LogInformation("TransactionConsumerService stopped.");
    }

    private async Task ProcessTransactionAsync(TransactionCreatedEvent evt, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var uow          = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
        var featureSvc   = scope.ServiceProvider.GetRequiredService<IFeatureEngineeringService>();
        var mlSvc        = scope.ServiceProvider.GetRequiredService<IFraudDetectionService>();

        try
        {
            // 0. Create and save transaction entity first
            var transaction = new Transaction
            {
                Id = evt.TransactionId,
                MerchantId = evt.MerchantId,
                CustomerId = evt.CustomerId,
                Amount = evt.Amount,
                Currency = evt.Currency,
                Country = evt.TransactionCountry,
                Mcc = evt.Mcc,
                DeviceId = evt.DeviceId,
                IpAddress = evt.IpAddress,
                Status = TransactionStatus.Pending,
                CreatedAt = evt.CreatedAt
            };
            await uow.Transactions.AddAsync(transaction, ct);
            await uow.SaveChangesAsync(ct);

            // 1. Compute 8 fraud features
            var features = await featureSvc.ComputeFeaturesAsync(
                evt.MerchantId,
                evt.CustomerId,
                evt.Amount,
                evt.TransactionCountry,
                evt.MerchantCountry,
                evt.Mcc,
                evt.CreatedAt,
                ct);

            // 2. Call FastAPI ML service
            var prediction = await mlSvc.PredictAsync(features, ct);
            var decision   = ParseDecision(prediction.Decision);

            // 3. Save prediction result
            var predictionEntity = new Prediction
            {
                TransactionId    = evt.TransactionId,
                FraudProbability = prediction.FraudProbability,
                Decision         = decision,
                ModelVersion     = "1.0.0"
            };
            await uow.Predictions.AddAsync(predictionEntity, ct);

            // 4. Save feature history
            var history = new TransactionHistory
            {
                TransactionId        = evt.TransactionId,
                AmountRatio          = features.AmountRatio,
                Hour                 = features.Hour,
                IsForeign            = features.IsForeign == 1,
                UserDegree           = features.UserDegree,
                MerchantDegree       = features.MerchantDegree,
                Mcc                  = features.MCC,
                UserFrequencyPerDay  = features.UserFrequencyPerDay,
                TimeDifferenceHours  = features.TimeDifferenceHours
            };
            await uow.TransactionHistories.AddAsync(history, ct);

            // 5. Update transaction status
            transaction.Status = decision switch
            {
                FraudDecision.Approved => TransactionStatus.Approved,
                FraudDecision.Review   => TransactionStatus.Review,
                FraudDecision.Blocked  => TransactionStatus.Blocked,
                _                      => TransactionStatus.Pending
            };
            uow.Transactions.Update(transaction);

            // 6. Create alert if needed
            Alert? alert = null;
            if (decision != FraudDecision.Approved)
            {
                alert = new Alert
                {
                    MerchantId    = evt.MerchantId,
                    TransactionId = evt.TransactionId,
                    Severity      = decision == FraudDecision.Blocked ? AlertSeverity.High : AlertSeverity.Medium,
                    Message       = decision == FraudDecision.Blocked
                        ? $"Transaction BLOCKED — fraud probability {prediction.FraudProbability:P1} exceeds threshold. Transaction: {evt.TransactionId}"
                        : $"Transaction flagged for REVIEW — fraud probability {prediction.FraudProbability:P1}. Transaction: {evt.TransactionId}",
                    IsRead = false
                };
                await uow.Alerts.AddAsync(alert, ct);
            }

            await uow.SaveChangesAsync(ct);

            _logger.LogInformation(
                "Transaction {Id} processed: decision={Decision}, probability={Prob:F4}",
                evt.TransactionId, decision, prediction.FraudProbability);

            // 7. Push real-time notification via SignalR
            if (alert is not null)
            {
                await SendSignalRAlertAsync(evt.MerchantId, alert, ct);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process TransactionCreatedEvent {TransactionId}", evt.TransactionId);
            throw;
        }
    }

    private async Task SendSignalRAlertAsync(Guid merchantId, Alert alert, CancellationToken ct)
    {
        try
        {
            var hubConnection = new HubConnectionBuilder()
                .WithUrl(_signalRHubUrl)
                .WithAutomaticReconnect()
                .Build();

            await hubConnection.StartAsync(ct);

            var alertDto = new AlertDto(
                alert.Id, alert.MerchantId, alert.TransactionId,
                alert.Severity.ToString(), alert.Message, alert.IsRead, alert.CreatedAt);

            await hubConnection.InvokeAsync(
                "SendFraudAlert",
                merchantId.ToString(),
                alertDto,
                cancellationToken: ct);

            await hubConnection.StopAsync(ct);
            _logger.LogInformation("SignalR alert sent for merchant {MerchantId}", merchantId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "SignalR notification failed for merchant {MerchantId}", merchantId);
            // Non-critical — don't re-throw
        }
    }

    private static FraudDecision ParseDecision(string decision) =>
        decision.ToLowerInvariant() switch
        {
            "approved" => FraudDecision.Approved,
            "review"   => FraudDecision.Review,
            "blocked"  => FraudDecision.Blocked,
            _          => FraudDecision.Review
        };
}

// IConfiguration is provided by Microsoft.Extensions.Configuration via the Host SDK
