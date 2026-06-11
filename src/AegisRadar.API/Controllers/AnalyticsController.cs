using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using AegisRadar.Shared.Wrappers;
using AegisRadar.Shared.DTOs;
using AegisRadar.Domain.Interfaces;
using AegisRadar.Domain.Entities;
using AegisRadar.Domain.Enums;

namespace AegisRadar.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AnalyticsController(IUnitOfWork unitOfWork, ILogger<AnalyticsController> logger) : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork = unitOfWork;
    private readonly ILogger<AnalyticsController> _logger = logger;

    /// <summary>
    /// Get analytics summary for the last 30 days
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAnalytics(CancellationToken ct)
    {
        try
        {
            var merchantIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(merchantIdClaim, out var merchantId))
            {
                _logger.LogWarning("Invalid merchant ID claim: {MerchantId}", merchantIdClaim);
                return Unauthorized("Invalid authentication token");
            }

            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
            var transactions = await _unitOfWork.Transactions.GetByMerchantIdInRangeAsync(
                merchantId, thirtyDaysAgo, DateTime.UtcNow, ct);

            var totalTransactions = transactions.Count();
            var blockedTransactions = transactions.Count(t => t.Status == TransactionStatus.Blocked);
            var fraudRate = totalTransactions > 0 
                ? Math.Round((double)blockedTransactions / totalTransactions * 100, 2) 
                : 0.0;

            var overallRiskScore = 0.0;
            var txWithPrediction = transactions.Where(t => t.Prediction != null).ToList();
            if (txWithPrediction.Count > 0)
            {
                overallRiskScore = Math.Round(
                    txWithPrediction.Average(t => t.Prediction!.FraudProbability), 2);
            }

            // 7-day trends
            var today = DateTime.UtcNow.Date;
            var trends = new TrendsDto
            {
                Labels = new List<string>(),
                FraudRate = new List<double>(),
                TransactionVolume = new List<int>()
            };

            for (int i = 6; i >= 0; i--)
            {
                var date = today.AddDays(-i);
                var dayTransactions = transactions
                    .Where(t => t.CreatedAt.Date == date)
                    .ToList();

                var label = i == 0 ? "Today" : $"D-{i}";
                var dayFraudRate = dayTransactions.Count > 0
                    ? Math.Round((double)dayTransactions.Count(t => t.Status == TransactionStatus.Blocked) 
                        / dayTransactions.Count * 100, 2)
                    : 0.0;

                trends.Labels.Add(label);
                trends.FraudRate.Add(dayFraudRate);
                trends.TransactionVolume.Add(dayTransactions.Count);
            }

            // Hourly distribution
            var hourlyDistribution = new List<HourlyDistributionDto>
            {
                CalculateHourlyBucket("00-06", transactions, 0, 6),
                CalculateHourlyBucket("06-12", transactions, 6, 12),
                CalculateHourlyBucket("12-18", transactions, 12, 18),
                CalculateHourlyBucket("18-24", transactions, 18, 24)
            };

            var response = new AnalyticsSummaryDto
            {
                TotalTransactions = totalTransactions,
                TotalFraudulent = blockedTransactions,
                FraudRate = fraudRate,
                OverallRiskScore = overallRiskScore,
                BlockedTransactions = blockedTransactions,
                AvgResponseTimeMs = 38,
                Trends = trends,
                TopRiskyMerchants = new List<object>(),
                HourlyDistribution = hourlyDistribution,
                LastUpdated = DateTime.UtcNow
            };

            return Ok(ApiResponse<AnalyticsSummaryDto>.Ok(response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching analytics");
            return StatusCode(500, ApiResponse<AnalyticsSummaryDto>.Fail("Failed to fetch analytics"));
        }
    }

    private static HourlyDistributionDto CalculateHourlyBucket(
        string bucket, 
        IEnumerable<Transaction> transactions, 
        int startHour, 
        int endHour)
    {
        var bucketTx = transactions
            .Where(t => t.CreatedAt.Hour >= startHour && t.CreatedAt.Hour < endHour)
            .ToList();

        var count = bucketTx.Count;
        var fraudCount = bucketTx.Count(t => t.Status == TransactionStatus.Blocked);
        var fraudRate = count > 0 ? Math.Round((double)fraudCount / count * 100, 2) : 0.0;

        return new HourlyDistributionDto
        {
            Bucket = bucket,
            Count = count,
            FraudRate = fraudRate
        };
    }
}
