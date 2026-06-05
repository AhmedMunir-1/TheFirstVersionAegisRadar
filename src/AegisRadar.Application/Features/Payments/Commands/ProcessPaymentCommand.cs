using AegisRadar.Application.DTOs;
using MediatR;

namespace AegisRadar.Application.Features.Payments.Commands;

public record ProcessPaymentCommand(ProcessPaymentDto Payment) : IRequest<PaymentResponseDto>;
