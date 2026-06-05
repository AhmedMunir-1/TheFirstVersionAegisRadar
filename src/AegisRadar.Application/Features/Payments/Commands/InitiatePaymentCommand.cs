using AegisRadar.Application.DTOs;
using MediatR;

namespace AegisRadar.Application.Features.Payments.Commands;

public record InitiatePaymentCommand(CreatePaymentDto Payment) : IRequest<PaymentResponseDto>;
