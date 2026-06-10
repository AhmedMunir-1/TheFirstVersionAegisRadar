using AegisRadar.Domain.Entities;
using AegisRadar.Domain.Enums;
using AegisRadar.Domain.Interfaces;
using AegisRadar.Shared.Constants;
using AegisRadar.Shared.DTOs;
using AegisRadar.Shared.Events;
using Confluent.Kafka;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net.Http.Json;
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
            {
                var partitionInfo = string.Join(",", partitions.Select(p => $"{p.Topic}[{p.Partition}]"));
                _logger.LogInformation("Partitions assigned: {Partitions} (Count: {Count})", partitionInfo, partitions.Count);
            })
            .SetPartitionsRevokedHandler((c, partitions) =>
            {
                var partitionInfo = string.Join(",", partitions.Select(p => $"{p.Topic}[{p.Partition}]"));
                _logger.LogInformation("Partitions revoked: {Partitions}", partitionInfo);
            })
            .Build();

        try
        {
            consumer.Subscribe(_topic);
            _logger.LogInformation("Subscribed to topic: {Topic}", _topic);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to subscribe to topic {Topic}", _topic);
            throw;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var result = consumer.Consume(TimeSpan.FromSeconds(3));
                
                if (result is null || result.IsPartitionEOF)
                {
                    // No message available or end of partition, continue
                    continue;
                }

                if (result.Message?.Value is null)
                {
                    // Empty message
                    continue;
                }

                var evt = JsonSerializer.Deserialize<TransactionCreatedEvent>(result.Message.Value);
                if (evt is null) 
                {
                    _logger.LogWarning("Failed to deserialize TransactionCreatedEvent from message");
                    continue;
                }

                // Skip invalid events with null merchant
                if (evt.MerchantId == Guid.Empty)
                {
                    _logger.LogWarning("Skipping TransactionCreatedEvent with empty MerchantId: {TransactionId}", evt.TransactionId);
                    consumer.Commit(result);
                    continue;
                }

                _logger.LogInformation("Consumed TransactionCreatedEvent {TransactionId} from partition {Partition}", evt.TransactionId, result.Partition);

                await ProcessTransactionAsync(evt, stoppingToken);
                consumer.Commit(result);
            }
            catch (OperationCanceledException) 
            { 
                break; 
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Kafka consumer loop");
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
            // 0. Get or create transaction entity
            // The transaction may already exist if it was created by SubmitTransactionCommand
            var transaction = await uow.Transactions.GetByIdAsync(evt.TransactionId, ct);
            
            if (transaction is null)
            {
                // Transaction doesn't exist yet, create it
                transaction = new Transaction
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
            }

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
            var decision   = ParseDecision(prediction.decision);

            // 3. Save prediction result
            var predictionEntity = new Prediction
            {
                TransactionId    = evt.TransactionId,
                FraudProbability = prediction.fraud_probability,
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

            // 5. Update transaction status based on decision AND fraud probability
            // Use aggressive thresholds to maximize auto-decisions and minimize "Review" count
            transaction.Status = decision switch
            {
                FraudDecision.Approved => TransactionStatus.Approved,
                // Re-evaluate Review decisions using aggressive thresholds
                FraudDecision.Review => prediction.fraud_probability switch
                {
                    >= 0.60 => TransactionStatus.Blocked,   // Moderate-high fraud -> block
                    <= 0.40 => TransactionStatus.Approved,  // Low fraud -> approve
                    _ => TransactionStatus.Review           // Only 0.40-0.60 range needs review (rare)
                },
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
                        ? $"Transaction BLOCKED — fraud probability {prediction.fraud_probability:P1} exceeds threshold. Transaction: {evt.TransactionId}"
                        : $"Transaction flagged for REVIEW — fraud probability {prediction.fraud_probability:P1}. Transaction: {evt.TransactionId}",
                    IsRead = false
                };
                await uow.Alerts.AddAsync(alert, ct);
            }

            await uow.SaveChangesAsync(ct);

            _logger.LogInformation(
                "Transaction {Id} processed: decision={Decision}, probability={Prob:F4}",
                evt.TransactionId, decision, prediction.fraud_probability);

            // 7. Push real-time notification via SignalR
            if (alert is not null)
            {
                await SendSignalRAlertAsync(evt.MerchantId, alert, ct);
            }

            // 8. Always push TransactionUpdated for dashboard real-time updates
            var transactionDto = new TransactionResponseDto
            {
                Id = transaction.Id,
                MerchantId = transaction.MerchantId,
                CustomerId = transaction.CustomerId,
                Amount = transaction.Amount,
                Currency = transaction.Currency,
                Status = transaction.Status.ToString(),
                TransactionCountry = transaction.Country,
                MerchantCountry = transaction.MerchantCountry,
                Mcc = transaction.Mcc,
                DeviceId = transaction.DeviceId,
                IpAddress = transaction.IpAddress,
                CreatedAt = transaction.CreatedAt,
                Prediction = new PredictionResponseDto
                {
                    FraudProbability = predictionEntity.FraudProbability,
                    Decision = predictionEntity.Decision.ToString(),
                    ModelVersion = predictionEntity.ModelVersion,
                    CreatedAt = predictionEntity.CreatedAt,
                    AmountRatio = history.AmountRatio,
                    Hour = history.Hour,
                    IsForeign = history.IsForeign ? true : false,
                    UserDegree = history.UserDegree,
                    MerchantDegree = history.MerchantDegree,
                    UserFrequencyPerDay = history.UserFrequencyPerDay,
                    TimeDifferenceHours = history.TimeDifferenceHours
                }
            };

            await SendSignalRTransactionUpdateAsync(evt.MerchantId, transactionDto, ct);
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
            var alertDto = new AlertDto
            {
                Id = alert.Id,
                MerchantId = alert.MerchantId,
                TransactionId = alert.TransactionId,
                Severity = alert.Severity.ToString(),
                Message = alert.Message,
                IsRead = alert.IsRead,
                CreatedAt = alert.CreatedAt
            };

            var apiBaseUrl = _signalRHubUrl.Replace("/hubs/fraud-alerts", string.Empty);
            var notificationUrl = $"{apiBaseUrl}/api/notifications/fraud-alert";

            using (var client = new HttpClient())
            {
                client.Timeout = TimeSpan.FromSeconds(5);
                var request = new
                {
                    merchantId = merchantId,
                    alert = alertDto
                };

                var response = await client.PostAsJsonAsync(notificationUrl, request, ct);
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("SignalR alert sent for merchant {MerchantId}", merchantId);
                }
                else
                {
                    _logger.LogWarning("Failed to send notification. Status: {StatusCode}", response.StatusCode);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "SignalR notification failed for merchant {MerchantId}", merchantId);
            // Non-critical — don't re-throw
        }
    }

    private async Task SendSignalRTransactionUpdateAsync(Guid merchantId, TransactionResponseDto transaction, CancellationToken ct)
    {
        try
        {
            var apiBaseUrl = _signalRHubUrl.Replace("/hubs/fraud-alerts", string.Empty);
            var updateUrl = $"{apiBaseUrl}/api/notifications/transaction-update";

            using (var client = new HttpClient())
            {
                client.Timeout = TimeSpan.FromSeconds(5);
                var request = new
                {
                    merchantId = merchantId,
                    transaction = transaction
                };

                var response = await client.PostAsJsonAsync(updateUrl, request, ct);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to send transaction update. Status: {StatusCode}", response.StatusCode);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "SignalR transaction update failed for merchant {MerchantId}", merchantId);
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
