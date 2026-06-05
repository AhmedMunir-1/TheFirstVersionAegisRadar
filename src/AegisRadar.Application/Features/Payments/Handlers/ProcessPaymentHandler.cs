using AegisRadar.Application.DTOs;
using AegisRadar.Domain.Enums;
using AegisRadar.Domain.Interfaces;
using MediatR;
using AegisRadar.Application.Features.Payments.Commands;

namespace AegisRadar.Application.Features.Payments.Handlers;

public class ProcessPaymentHandler : IRequestHandler<ProcessPaymentCommand, PaymentResponseDto>
{
    private readonly IUnitOfWork _uow;

    public ProcessPaymentHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<PaymentResponseDto> Handle(ProcessPaymentCommand request, CancellationToken cancellationToken)
    {
        var dto = request.Payment;
        var payment = await _uow.Payments.GetByIdAsync(dto.PaymentId, cancellationToken);
        if (payment == null) throw new KeyNotFoundException("Payment not found");

        // Simulate processing - in real flow call payment gateway and fraud API
        payment.TransactionReference = dto.TransactionReference;
        payment.ProcessedAt = DateTime.UtcNow;
        payment.Status = PaymentStatus.Processing;

        // Placeholder: mark completed
        payment.Status = PaymentStatus.Completed;
        payment.IsFraudDetected = false;
        payment.FraudScore = 0m;

        _uow.Payments.Update(payment);
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
