using AegisRadar.Domain.Interfaces;
using MediatR;

namespace AegisRadar.Application.Features.Alerts.Commands;

// ─── Command ─────────────────────────────────────────────────────────────────
public record MarkAlertReadCommand(Guid AlertId, Guid MerchantId) : IRequest<bool>;

public class MarkAlertReadCommandHandler : IRequestHandler<MarkAlertReadCommand, bool>
{
    private readonly IUnitOfWork _uow;
    public MarkAlertReadCommandHandler(IUnitOfWork uow) => _uow = uow;

    public async Task<bool> Handle(MarkAlertReadCommand request, CancellationToken cancellationToken)
    {
        var alert = await _uow.Alerts.GetByIdAsync(request.AlertId, cancellationToken);
        if (alert is null || alert.MerchantId != request.MerchantId) return false;

        alert.IsRead = true;
        _uow.Alerts.Update(alert);
        await _uow.SaveChangesAsync(cancellationToken);
        return true;
    }
}
