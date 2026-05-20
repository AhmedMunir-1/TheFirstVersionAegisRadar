using AegisRadar.Application.DTOs;
using AegisRadar.Application.Interfaces;
using AegisRadar.Domain.Enums;
using AegisRadar.Domain.Interfaces;
using AegisRadar.Shared.Constants;
using MediatR;

namespace AegisRadar.Application.Features.Dashboard.Queries;

// ─── Query ───────────────────────────────────────────────────────────────────
public record GetDashboardStatsQuery(Guid MerchantId) : IRequest<DashboardStatsDto>;

// ─── Handler ─────────────────────────────────────────────────────────────────
public class GetDashboardStatsQueryHandler : IRequestHandler<GetDashboardStatsQuery, DashboardStatsDto>
{
    private readonly IUnitOfWork _uow;
    private readonly ICacheService _cache;

    public GetDashboardStatsQueryHandler(IUnitOfWork uow, ICacheService cache)
    {
        _uow   = uow;
        _cache = cache;
    }

    public async Task<DashboardStatsDto> Handle(GetDashboardStatsQuery request, CancellationToken cancellationToken)
    {
        var cacheKey = CacheKeys.DashboardStats(request.MerchantId);
        var cached   = await _cache.GetAsync<DashboardStatsDto>(cacheKey, cancellationToken);
        if (cached is not null) return cached;

        var todayTxns  = await _uow.Transactions.GetByMerchantIdAsync(request.MerchantId, 1, 10000, cancellationToken);
        var today      = todayTxns.Where(t => t.CreatedAt.Date == DateTime.UtcNow.Date).ToList();

        var txToday    = today.Count;
        var flagged    = today.Count(t => t.Status == TransactionStatus.Review);
        var blocked    = today.Count(t => t.Status == TransactionStatus.Blocked);
        var approved   = today.Count(t => t.Status == TransactionStatus.Approved);
        var total      = txToday == 0 ? 1 : txToday;
        var unread     = await _uow.Alerts.GetUnreadCountAsync(request.MerchantId, cancellationToken);
        var volume     = today.Sum(t => t.Amount);

        var avgProb = today
            .Where(t => t.Prediction != null)
            .Select(t => t.Prediction!.FraudProbability)
            .DefaultIfEmpty(0)
            .Average();

        var stats = new DashboardStatsDto(
            txToday,
            flagged,
            blocked,
            unread,
            Math.Round((double)approved / total * 100, 1),
            Math.Round(avgProb, 4),
            volume);

        await _cache.SetAsync(cacheKey, stats, TimeSpan.FromSeconds(30), cancellationToken);
        return stats;
    }
}

// ─── Fraud Trends Query ───────────────────────────────────────────────────────
public record GetFraudTrendsQuery(Guid MerchantId, int Days = 7) : IRequest<IEnumerable<FraudTrendDto>>;

public class GetFraudTrendsQueryHandler : IRequestHandler<GetFraudTrendsQuery, IEnumerable<FraudTrendDto>>
{
    private readonly IUnitOfWork _uow;
    private readonly ICacheService _cache;

    public GetFraudTrendsQueryHandler(IUnitOfWork uow, ICacheService cache)
    {
        _uow   = uow;
        _cache = cache;
    }

    public async Task<IEnumerable<FraudTrendDto>> Handle(GetFraudTrendsQuery request, CancellationToken cancellationToken)
    {
        var cacheKey = CacheKeys.FraudTrends(request.MerchantId);
        var cached   = await _cache.GetAsync<List<FraudTrendDto>>(cacheKey, cancellationToken);
        if (cached is not null) return cached;

        var all  = await _uow.Transactions.GetByMerchantIdAsync(request.MerchantId, 1, 100000, cancellationToken);
        var from = DateTime.UtcNow.Date.AddDays(-request.Days + 1);
        var recent = all.Where(t => t.CreatedAt.Date >= from).ToList();

        var trends = Enumerable.Range(0, request.Days)
            .Select(i => DateTime.UtcNow.Date.AddDays(-request.Days + 1 + i))
            .Select(date => new FraudTrendDto(
                date.ToString("yyyy-MM-dd"),
                recent.Count(t => t.CreatedAt.Date == date && t.Status == TransactionStatus.Approved),
                recent.Count(t => t.CreatedAt.Date == date && t.Status == TransactionStatus.Review),
                recent.Count(t => t.CreatedAt.Date == date && t.Status == TransactionStatus.Blocked)))
            .ToList();

        await _cache.SetAsync(cacheKey, trends, TimeSpan.FromMinutes(2), cancellationToken);
        return trends;
    }
}

// ─── Recent Transactions Query ────────────────────────────────────────────────
public record GetRecentTransactionsQuery(Guid MerchantId, int Count = 10) : IRequest<IEnumerable<TransactionResponseDto>>;

public class GetRecentTransactionsQueryHandler : IRequestHandler<GetRecentTransactionsQuery, IEnumerable<TransactionResponseDto>>
{
    private readonly IUnitOfWork _uow;

    public GetRecentTransactionsQueryHandler(IUnitOfWork uow) => _uow = uow;

    public async Task<IEnumerable<TransactionResponseDto>> Handle(GetRecentTransactionsQuery request, CancellationToken cancellationToken)
    {
        var txns = await _uow.Transactions.GetRecentByMerchantAsync(request.MerchantId, request.Count, cancellationToken);
        return txns.Select(t => new TransactionResponseDto(
            t.Id, t.MerchantId, t.CustomerId, t.Amount, t.Currency, t.Country, t.Mcc,
            t.Status.ToString(), t.CreatedAt,
            t.Prediction == null ? null : new PredictionResponseDto(
                t.Prediction.FraudProbability, t.Prediction.Decision.ToString(),
                t.Prediction.ModelVersion, t.Prediction.CreatedAt)));
    }
}
