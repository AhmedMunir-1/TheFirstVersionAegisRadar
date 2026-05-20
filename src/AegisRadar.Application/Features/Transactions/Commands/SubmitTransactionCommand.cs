using AegisRadar.Application.DTOs;
using AegisRadar.Application.Interfaces;
using AegisRadar.Domain.Entities;
using AegisRadar.Domain.Interfaces;
using AegisRadar.Shared.Constants;
using AegisRadar.Shared.Events;
using MediatR;

namespace AegisRadar.Application.Features.Transactions.Commands;

// ─── Command ────────────────────────────────────────────────────────────────
public record SubmitTransactionCommand(
    Guid MerchantId,
    string MerchantCountry,
    TransactionRequestDto Request
) : IRequest<TransactionResponseDto>;

// ─── Handler ────────────────────────────────────────────────────────────────
public class SubmitTransactionCommandHandler : IRequestHandler<SubmitTransactionCommand, TransactionResponseDto>
{
    private readonly IUnitOfWork _uow;
    private readonly IKafkaProducer _kafka;

    public SubmitTransactionCommandHandler(IUnitOfWork uow, IKafkaProducer kafka)
    {
        _uow = uow;
        _kafka = kafka;
    }

    public async Task<TransactionResponseDto> Handle(SubmitTransactionCommand command, CancellationToken cancellationToken)
    {
        var req = command.Request;

        var transaction = new Transaction
        {
            MerchantId = command.MerchantId,
            CustomerId  = req.CustomerId,
            Amount      = req.Amount,
            Currency    = req.Currency,
            Country     = req.Country,
            Mcc         = req.Mcc,
            DeviceId    = req.DeviceId,
            IpAddress   = req.IpAddress,
        };

        await _uow.Transactions.AddAsync(transaction, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        // Publish to Kafka asynchronously
        var evt = new TransactionCreatedEvent
        {
            TransactionId     = transaction.Id,
            MerchantId        = transaction.MerchantId,
            CustomerId        = transaction.CustomerId,
            Amount            = transaction.Amount,
            Currency          = transaction.Currency,
            TransactionCountry = transaction.Country,
            MerchantCountry   = command.MerchantCountry,
            Mcc               = transaction.Mcc,
            DeviceId          = transaction.DeviceId,
            IpAddress         = transaction.IpAddress,
            CreatedAt         = transaction.CreatedAt
        };

        await _kafka.PublishTransactionCreatedAsync(evt, cancellationToken);

        return new TransactionResponseDto(
            transaction.Id,
            transaction.MerchantId,
            transaction.CustomerId,
            transaction.Amount,
            transaction.Currency,
            transaction.Country,
            transaction.Mcc,
            transaction.Status.ToString(),
            transaction.CreatedAt,
            null);
    }
}
