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
public class HistoryController(IUnitOfWork unitOfWork, ILogger<HistoryController> logger) : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork = unitOfWork;
    private readonly ILogger<HistoryController> _logger = logger;

    /// <summary>
    /// Get transaction history with filtering and pagination
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetHistory(
        [FromQuery] int limit = 500,
        [FromQuery] int offset = 0,
        [FromQuery] string? status = null,
        [FromQuery] double? riskMin = null,
        CancellationToken ct = default)
    {
        try
        {
            var merchantIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(merchantIdClaim, out var merchantId))
            {
                _logger.LogWarning("Invalid merchant ID claim: {MerchantId}", merchantIdClaim);
                return Unauthorized("Invalid authentication token");
            }

            // Clamp limit
            limit = Math.Min(limit, 1000);
            if (limit < 1) limit = 500;

            // Get all transactions for merchant
            var allTransactions = await _unitOfWork.Transactions.GetByMerchantIdAsync(
                merchantId, 1, int.MaxValue, ct);

            // Apply status filter
            if (!string.IsNullOrEmpty(status))
            {
                allTransactions = allTransactions
                    .Where(t => t.Status.ToString() == status)
                    .ToList();
            }

            // Apply risk filter
            if (riskMin.HasValue && riskMin.Value > 0)
            {
                allTransactions = allTransactions
                    .Where(t => t.Prediction != null && t.Prediction.FraudProbability >= riskMin.Value)
                    .ToList();
            }

            // Map to HistoryTransactionDto with RiskLevel
            var historyTransactions = allTransactions
                .Skip(offset)
                .Take(limit)
                .Select(t => new HistoryTransactionDto
                {
                    Id = t.Id,
                    MerchantId = t.MerchantId,
                    CustomerId = t.CustomerId,
                    Amount = t.Amount,
                    Currency = t.Currency,
                    Status = t.Status.ToString(),
                    TransactionCountry = t.Country,
                    MerchantCountry = t.MerchantCountry,
                    Mcc = t.Mcc,
                    DeviceId = t.DeviceId,
                    IpAddress = t.IpAddress,
                    CreatedAt = t.CreatedAt,
                    Prediction = t.Prediction != null
                        ? new PredictionResponseDto
                        {
                            FraudProbability = t.Prediction.FraudProbability,
                            Decision = t.Prediction.Decision.ToString(),
                            ModelVersion = t.Prediction.ModelVersion,
                            CreatedAt = t.Prediction.CreatedAt,
                            AmountRatio = t.Prediction.AmountRatio ?? 0,
                            Hour = t.Prediction.Hour ?? 0,
                            IsForeign = t.Prediction.IsForeign ?? false,
                            UserDegree = t.Prediction.UserDegree ?? 0,
                            MerchantDegree = t.Prediction.MerchantDegree ?? 0,
                            UserFrequencyPerDay = t.Prediction.UserFrequencyPerDay ?? 0,
                            TimeDifferenceHours = t.Prediction.TimeDifferenceHours ?? 0
                        }
                        : null,
                    RiskLevel = DeterminRiskLevel(t.Prediction?.FraudProbability ?? 0)
                })
                .ToList();

            var fraudCount = allTransactions.Where(t => t.Status == TransactionStatus.Blocked).Count();
            var reviewCount = allTransactions.Where(t => t.Status == TransactionStatus.Review).Count();
            var totalAmount = allTransactions.Sum(t => t.Amount);

            var response = new HistoryResponseDto
            {
                Transactions = historyTransactions,
                Total = allTransactions.Count(),
                FraudCount = fraudCount,
                ReviewCount = reviewCount,
                TotalAmount = totalAmount
            };

            return Ok(ApiResponse<HistoryResponseDto>.Ok(response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching transaction history");
            return StatusCode(500, ApiResponse<HistoryResponseDto>.Fail("Failed to fetch transaction history"));
        }
    }

    private static string DeterminRiskLevel(double fraudProbability)
    {
        if (fraudProbability >= 0.70) return "HIGH";
        if (fraudProbability >= 0.40) return "MEDIUM";
        return "LOW";
    }
}
