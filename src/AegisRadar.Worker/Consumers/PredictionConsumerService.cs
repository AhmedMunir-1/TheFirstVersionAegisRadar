using AegisRadar.Domain.Entities;
using AegisRadar.Domain.Enums;
using AegisRadar.Domain.Interfaces;
using Confluent.Kafka;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace AegisRadar.Worker.Consumers;

public class PredictionResult
{
    [JsonPropertyName("transaction_id")]
    public string? TransactionId { get; set; }

    [JsonPropertyName("merchant_id")]
    public string? MerchantId { get; set; }

    [JsonPropertyName("customer_id")]
    public string? CustomerId { get; set; }

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }

    [JsonPropertyName("fraud_probability")]
    public double FraudProbability { get; set; }

    [JsonPropertyName("decision")]
    public string? Decision { get; set; }

    [JsonPropertyName("model_version")]
    public string? ModelVersion { get; set; }

    [JsonPropertyName("timestamp")]
    public DateTime Timestamp { get; set; }
}

public class PredictionConsumerService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<PredictionConsumerService> _logger;
    private readonly ConsumerConfig _consumerConfig;

    public PredictionConsumerService(
        IServiceScopeFactory scopeFactory,
        ILogger<PredictionConsumerService> logger,
        IOptions<AegisRadar.Infrastructure.Kafka.KafkaSettings> kafkaOptions)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;

        _consumerConfig = new ConsumerConfig
        {
            BootstrapServers = kafkaOptions.Value.BootstrapServers,
            GroupId = "aegisradar-prediction-consumer",
            AutoOffsetReset = AutoOffsetReset.Latest,
            EnableAutoCommit = false,
            SessionTimeoutMs = 30000,
            MaxPollIntervalMs = 300000
        };
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("PredictionConsumerService starting. Topic=predictions.results");

        // Wait for Kafka to be ready
        await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);

        using var consumer = new ConsumerBuilder<string, string>(_consumerConfig)
            .SetErrorHandler((_, e) => _logger.LogError("Kafka consumer error: {Reason}", e.Reason))
            .SetPartitionsAssignedHandler((c, partitions) =>
                _logger.LogInformation("Partitions assigned: {Partitions}", string.Join(",", partitions)))
            .Build();

        consumer.Subscribe("predictions.results");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var result = consumer.Consume(TimeSpan.FromSeconds(1));
                if (result?.Message?.Value is null) continue;

                var predictionResult = JsonSerializer.Deserialize<PredictionResult>(result.Message.Value);
                if (predictionResult is null) continue;

                _logger.LogInformation("Consumed prediction for transaction {TransactionId}", predictionResult.TransactionId);

                await SavePredictionAsync(predictionResult, stoppingToken);
                consumer.Commit(result);
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing prediction message");
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }

        consumer.Close();
        _logger.LogInformation("PredictionConsumerService stopped.");
    }

    private async Task SavePredictionAsync(PredictionResult predictionResult, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var uow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

        try
        {
            // Parse decision
            var decision = predictionResult.Decision?.ToUpper() switch
            {
                "APPROVED" => FraudDecision.Approved,
                "BLOCKED" => FraudDecision.Blocked,
                "REVIEW" => FraudDecision.Review,
                _ => FraudDecision.Approved
            };

            // Try to find transaction by transaction ID (Id)
            var allTransactions = await uow.Transactions.GetAllAsync(ct);
            var transaction = allTransactions.FirstOrDefault(t => 
                t.Id.ToString() == predictionResult.TransactionId);

            if (transaction is null)
            {
                _logger.LogWarning("Transaction not found for prediction {TransactionId}", predictionResult.TransactionId);
                return;
            }

            // Save or update prediction
            var allPredictions = await uow.Predictions.GetAllAsync(ct);
            var prediction = allPredictions.FirstOrDefault(p => p.TransactionId == transaction.Id);

            if (prediction is null)
            {
                prediction = new Prediction
                {
                    TransactionId = transaction.Id,
                    FraudProbability = predictionResult.FraudProbability,
                    Decision = decision,
                    ModelVersion = predictionResult.ModelVersion ?? "1.0.0",
                    CreatedAt = predictionResult.Timestamp
                };
                await uow.Predictions.AddAsync(prediction, ct);
            }
            else
            {
                prediction.FraudProbability = predictionResult.FraudProbability;
                prediction.Decision = decision;
                prediction.ModelVersion = predictionResult.ModelVersion ?? "1.0.0";
                uow.Predictions.Update(prediction);
            }

            // Update transaction status based on prediction
            transaction.Status = decision switch
            {
                FraudDecision.Approved => TransactionStatus.Approved,
                FraudDecision.Review => TransactionStatus.Review,
                FraudDecision.Blocked => TransactionStatus.Blocked,
                _ => TransactionStatus.Pending
            };

            uow.Transactions.Update(transaction);

            // Create alert if fraud detected or needs review
            if (decision == FraudDecision.Blocked || decision == FraudDecision.Review)
            {
                var alert = new Alert
                {
                    MerchantId = transaction.MerchantId,
                    TransactionId = transaction.Id,
                    Severity = decision == FraudDecision.Blocked ? AlertSeverity.Critical : AlertSeverity.High,
                    Message = $"Fraud probability: {predictionResult.FraudProbability:P2} ({decision})",
                    IsRead = false
                };
                await uow.Alerts.AddAsync(alert, ct);
            }

            // Save all changes
            await uow.SaveChangesAsync(ct);

            var icon = decision switch
            {
                FraudDecision.Approved => "✅",
                FraudDecision.Blocked => "🚨",
                FraudDecision.Review => "⚠️",
                _ => "❓"
            };

            _logger.LogInformation(
                "{Icon} Saved prediction: TxnId={TransactionId}, Probability={Probability:P}, Decision={Decision}",
                icon, transaction.Id, predictionResult.FraudProbability, decision);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving prediction for transaction {TransactionId}", predictionResult.TransactionId);
        }
    }
}
