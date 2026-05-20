using AegisRadar.Application.DTOs;
using AegisRadar.Domain.Interfaces;
using MediatR;

namespace AegisRadar.Application.Features.Alerts.Queries;

// ─── Query ───────────────────────────────────────────────────────────────────
public record GetAlertsQuery(Guid MerchantId, bool UnreadOnly = false) : IRequest<IEnumerable<AlertDto>>;

public class GetAlertsQueryHandler : IRequestHandler<GetAlertsQuery, IEnumerable<AlertDto>>
{
    private readonly IUnitOfWork _uow;
    public GetAlertsQueryHandler(IUnitOfWork uow) => _uow = uow;

    public async Task<IEnumerable<AlertDto>> Handle(GetAlertsQuery request, CancellationToken cancellationToken)
    {
        var alerts = await _uow.Alerts.GetByMerchantIdAsync(request.MerchantId, request.UnreadOnly, cancellationToken);
        return alerts.Select(a => new AlertDto(
            a.Id, a.MerchantId, a.TransactionId,
            a.Severity.ToString(), a.Message, a.IsRead, a.CreatedAt));
    }
}
