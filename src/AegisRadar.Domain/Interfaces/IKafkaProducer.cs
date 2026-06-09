using AegisRadar.Shared.Events;

namespace AegisRadar.Domain.Interfaces;

public interface IKafkaProducer
{
    Task PublishTransactionCreatedAsync(TransactionCreatedEvent evt, CancellationToken cancellationToken = default);
}
