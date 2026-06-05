using AegisRadar.Application.DTOs;
using AegisRadar.Domain.Entities;
using AegisRadar.Domain.Enums;
using AegisRadar.Domain.Interfaces;
using MediatR;
using AegisRadar.Application.Features.Payments.Commands;

namespace AegisRadar.Application.Features.Payments.Handlers;

public class InitiatePaymentHandler : IRequestHandler<InitiatePaymentCommand, PaymentResponseDto>
{
    private readonly IUnitOfWork _uow;

    public InitiatePaymentHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<PaymentResponseDto> Handle(InitiatePaymentCommand request, CancellationToken cancellationToken)
    {
        var dto = request.Payment;

        var payment = new Payment
        {
            MerchantId = dto.MerchantId,
            PlanId = dto.PlanId,
            Amount = dto.Amount,
            Status = PaymentStatus.Pending,
            TransactionReference = string.Empty,
            PeriodStartDate = DateTime.UtcNow,
            PeriodEndDate = DateTime.UtcNow.AddMonths(1),
            CreatedAt = DateTime.UtcNow
        };

        await _uow.Payments.AddAsync(payment, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        return new PaymentResponseDto
        {
            Id = payment.Id,
            MerchantId = payment.MerchantId,
            PlanId = payment.PlanId,
            Amount = payment.Amount,
            Status = payment.Status.ToString(),
            ProcessedAt = payment.ProcessedAt,
            IsFraudDetected = payment.IsFraudDetected,
            FraudScore = payment.FraudScore ?? 0m
        };
    }
}
