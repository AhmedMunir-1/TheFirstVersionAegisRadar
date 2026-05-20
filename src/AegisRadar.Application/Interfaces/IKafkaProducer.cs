using AegisRadar.Application.DTOs;
using AegisRadar.Shared.Events;

namespace AegisRadar.Application.Interfaces;

public interface IKafkaProducer
{
    Task PublishTransactionCreatedAsync(TransactionCreatedEvent evt, CancellationToken cancellationToken = default);
}
