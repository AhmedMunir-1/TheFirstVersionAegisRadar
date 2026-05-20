using AegisRadar.Application.DTOs;
using FluentValidation;

namespace AegisRadar.Application.Validators;

public class TransactionRequestValidator : AbstractValidator<TransactionRequestDto>
{
    public TransactionRequestValidator()
    {
        RuleFor(x => x.CustomerId)
            .NotEmpty().WithMessage("CustomerId is required.")
            .MaximumLength(100);

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Amount must be greater than zero.");

        RuleFor(x => x.Currency)
            .NotEmpty()
            .Length(3).WithMessage("Currency must be a 3-letter ISO code (e.g. EGP).");

        RuleFor(x => x.Country)
            .NotEmpty()
            .Length(2).WithMessage("Country must be a 2-letter ISO code (e.g. EG).");

        RuleFor(x => x.Mcc)
            .InclusiveBetween(1, 9999).WithMessage("MCC must be between 1 and 9999.");

        RuleFor(x => x.DeviceId)
            .NotEmpty().WithMessage("DeviceId is required.");

        RuleFor(x => x.IpAddress)
            .NotEmpty().WithMessage("IpAddress is required.");
    }
}
