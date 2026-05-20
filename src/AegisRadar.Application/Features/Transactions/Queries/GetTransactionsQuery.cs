using AegisRadar.Application.DTOs;
using AegisRadar.Domain.Interfaces;
using MediatR;

namespace AegisRadar.Application.Features.Transactions.Queries;

// ─── Query ───────────────────────────────────────────────────────────────────
public record GetTransactionsQuery(Guid MerchantId, int Page = 1, int PageSize = 20) : IRequest<IEnumerable<TransactionResponseDto>>;

// ─── Handler ─────────────────────────────────────────────────────────────────
public class GetTransactionsQueryHandler : IRequestHandler<GetTransactionsQuery, IEnumerable<TransactionResponseDto>>
{
    private readonly IUnitOfWork _uow;

    public GetTransactionsQueryHandler(IUnitOfWork uow) => _uow = uow;

    public async Task<IEnumerable<TransactionResponseDto>> Handle(GetTransactionsQuery request, CancellationToken cancellationToken)
    {
        var transactions = await _uow.Transactions.GetByMerchantIdAsync(request.MerchantId, request.Page, request.PageSize, cancellationToken);

        return transactions.Select(t => new TransactionResponseDto(
            t.Id,
            t.MerchantId,
            t.CustomerId,
            t.Amount,
            t.Currency,
            t.Country,
            t.Mcc,
            t.Status.ToString(),
            t.CreatedAt,
            t.Prediction == null ? null : new PredictionResponseDto(
                t.Prediction.FraudProbability,
                t.Prediction.Decision.ToString(),
                t.Prediction.ModelVersion,
                t.Prediction.CreatedAt)));
    }
}
