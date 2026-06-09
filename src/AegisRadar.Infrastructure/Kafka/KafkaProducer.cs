using AegisRadar.Domain.Interfaces;
using AegisRadar.Shared.Events;
using Confluent.Kafka;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace AegisRadar.Infrastructure.Kafka;

public class KafkaSettings
{
    public string BootstrapServers { get; set; } = "localhost:9092";
    public string GroupId { get; set; } = "aegisradar-worker";
    public string TransactionsTopic { get; set; } = "aegis-transactions";
}

public class KafkaProducer : IKafkaProducer, IDisposable
{
    private readonly IProducer<string, string> _producer;
    private readonly KafkaSettings _settings;
    private readonly ILogger<KafkaProducer> _logger;

    public KafkaProducer(IOptions<KafkaSettings> settings, ILogger<KafkaProducer> logger)
    {
        _settings = settings.Value;
        _logger   = logger;

        var config = new ProducerConfig
        {
            BootstrapServers = _settings.BootstrapServers,
            Acks             = Acks.All,
            EnableIdempotence = true,
            MessageSendMaxRetries = 3
        };

        _producer = new ProducerBuilder<string, string>(config).Build();
    }

    public async Task PublishTransactionCreatedAsync(TransactionCreatedEvent evt, CancellationToken cancellationToken = default)
    {
        var payload = JsonSerializer.Serialize(evt);
        var message = new Message<string, string>
        {
            Key   = evt.MerchantId.ToString(),
            Value = payload
        };

        try
        {
            var result = await _producer.ProduceAsync(_settings.TransactionsTopic, message, cancellationToken);
            _logger.LogInformation("Published TransactionCreatedEvent {TransactionId} to {Topic}@{Partition}",
                evt.TransactionId, result.Topic, result.Partition);
        }
        catch (ProduceException<string, string> ex)
        {
            _logger.LogError(ex, "Failed to publish TransactionCreatedEvent {TransactionId}", evt.TransactionId);
            throw;
        }
    }

    public void Dispose() => _producer.Dispose();
}
