using AegisRadar.Domain.Enums;
using AegisRadar.Domain.Interfaces;
using AegisRadar.Shared.DTOs;
using AegisRadar.Shared.Wrappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace AegisRadar.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
[Produces("application/json")]
public class DashboardController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public DashboardController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    [HttpGet("stats")]
    [ResponseCache(Duration = 5)]  // Cache for 5 seconds to reduce DB hits
    [ProducesResponseType(typeof(ApiResponse<DashboardStatsDto>), 200)]
    public async Task<IActionResult> GetStats(CancellationToken ct)
    {
        var merchantId = GetMerchantId();
        if (merchantId == Guid.Empty) return Unauthorized();

        try
        {
            var today = DateTime.UtcNow.Date;
            
            // Load transactions for today and flagged ones (only what we need)
            var todayCount = await _uow.Transactions.GetTodayCountByMerchantAsync(merchantId, ct);
            var monthlyCount = await _uow.Transactions.GetMonthlyCountByMerchantAsync(merchantId, ct);
            var flaggedTransactions = await _uow.Transactions.GetFlaggedByMerchantAsync(merchantId, ct);

            // Get recent 1000 transactions to calculate stats (not all)
            var recentPage = await _uow.Transactions.GetByMerchantIdAsync(merchantId, 1, 1000, ct);
            var recentList = recentPage.ToList();

            var approvedCount = recentList.Count(t => t.Status == TransactionStatus.Approved);
            var blockedCount = recentList.Count(t => t.Status == TransactionStatus.Blocked);
            var reviewCount = recentList.Count(t => t.Status == TransactionStatus.Review);

            var totalAmount = recentList.Sum(t => t.Amount);
            var todayTransactions = recentList.Where(t => t.CreatedAt >= today).ToList();
            var totalAmountToday = todayTransactions.Sum(t => t.Amount);
            var blockedTodayCount = todayTransactions.Count(t => t.Status == TransactionStatus.Blocked);

            var fraudRate = recentList.Count == 0 ? 0 : Math.Round((double)blockedCount / recentList.Count * 100, 2);
            var fraudRateToday = todayTransactions.Count == 0 ? 0 : Math.Round((double)blockedTodayCount / todayTransactions.Count * 100, 2);

            var stats = new DashboardStatsDto
            {
                TotalTransactions = monthlyCount,
                FraudulentCount = blockedCount,
                ReviewCount = reviewCount,
                ApprovedCount = approvedCount,
                BlockedCount = blockedCount,
                PendingReviewCount = reviewCount,
                TotalAmount = totalAmount,
                TotalAmountToday = totalAmountToday,
                TotalTransactionsToday = todayCount,
                FraudRate = fraudRate,
                FraudRateToday = fraudRateToday
            };

            return Ok(ApiResponse<DashboardStatsDto>.Ok(stats));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<DashboardStatsDto>.Fail($"Database error: {ex.Message}"));
        }
    }

    [HttpGet("trends")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<FraudTrendDto>>), 200)]
    public async Task<IActionResult> GetTrends([FromQuery] int days = 7, CancellationToken ct = default)
    {
        var merchantId = GetMerchantId();
        if (merchantId == Guid.Empty) return Unauthorized();

        try
        {
            var cutoff = DateTime.UtcNow.Date.AddDays(-Math.Max(days, 1) + 1);
            
            // Load ONLY the necessary data for the date range
            var transactionsInRange = await _uow.Transactions.GetByMerchantIdInRangeAsync(
                merchantId, cutoff, DateTime.UtcNow.AddDays(1), ct);

            var trends = transactionsInRange
                .GroupBy(t => t.CreatedAt.Date)
                .OrderBy(g => g.Key)
                .Select(g => 
                {
                    var dayTransactions = g.ToList();
                    var fraudCount = dayTransactions.Count(t => t.Status == TransactionStatus.Blocked);
                    var totalAmount = dayTransactions.Sum(t => t.Amount);
                    var avgFraudProbability = dayTransactions.Any(t => t.Prediction != null)
                        ? dayTransactions.Where(t => t.Prediction != null).Average(t => t.Prediction!.FraudProbability)
                        : 0;

                    return new FraudTrendDto
                    {
                        Date = g.Key,
                        Count = g.Count(),
                        TransactionCount = dayTransactions.Count,
                        FraudCount = fraudCount,
                        TotalAmount = totalAmount,
                        Percentage = transactionsInRange.Count() == 0 ? 0 : Math.Round((double)g.Count() / transactionsInRange.Count() * 100, 2),
                        AvgFraudProbability = Math.Round(avgFraudProbability, 4)
                    };
                })
                .ToList();

            return Ok(ApiResponse<IEnumerable<FraudTrendDto>>.Ok(trends));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<IEnumerable<FraudTrendDto>>.Fail($"Database error: {ex.Message}"));
        }
    }

    [HttpGet("recent")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<TransactionResponseDto>>), 200)]
    public async Task<IActionResult> GetRecent([FromQuery] int count = 10, CancellationToken ct = default)
    {
        var merchantId = GetMerchantId();
        if (merchantId == Guid.Empty) return Unauthorized();

        var recent = await _uow.Transactions.GetRecentByMerchantAsync(merchantId, count, ct);
        var response = recent.Select(tx => new TransactionResponseDto
        {
            Id = tx.Id,
            MerchantId = tx.MerchantId,
            CustomerId = tx.CustomerId,
            Amount = tx.Amount,
            Currency = tx.Currency,
            Status = tx.Status.ToString(),
            TransactionCountry = tx.Country,
            MerchantCountry = tx.MerchantCountry,
            Mcc = tx.Mcc,
            DeviceId = tx.DeviceId,
            IpAddress = tx.IpAddress,
            CreatedAt = tx.CreatedAt,
            Prediction = tx.Prediction is null ? null : new PredictionResponseDto
            {
                FraudProbability = tx.Prediction.FraudProbability,
                Decision = tx.Prediction.Decision.ToString(),
                ModelVersion = tx.Prediction.ModelVersion,
                CreatedAt = tx.Prediction.CreatedAt,
                AmountRatio = tx.Prediction.AmountRatio ?? 0,
                Hour = tx.Prediction.Hour ?? 0,
                IsForeign = tx.Prediction.IsForeign ?? false,
                UserDegree = tx.Prediction.UserDegree ?? 0,
                MerchantDegree = tx.Prediction.MerchantDegree ?? 0,
                UserFrequencyPerDay = tx.Prediction.UserFrequencyPerDay ?? 0,
                TimeDifferenceHours = tx.Prediction.TimeDifferenceHours ?? 0
            }
        });

        return Ok(ApiResponse<IEnumerable<TransactionResponseDto>>.Ok(response));
    }

    private Guid GetMerchantId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                  User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        return Guid.TryParse(sub, out var id) ? id : Guid.Empty;
    }
}
