using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AegisRadar.Shared.Wrappers;
using AegisRadar.Shared.DTOs;

namespace AegisRadar.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class DemoController(ILogger<DemoController> logger) : ControllerBase
{
    private readonly ILogger<DemoController> _logger = logger;
    private static readonly Random Random = new();

    /// <summary>
    /// Get demo system status (public endpoint)
    /// </summary>
    [HttpGet("status")]
    public IActionResult GetStatus()
    {
        try
        {
            var status = new DemoStatusDto
            {
                Status = "online",
                ModelVersion = "ensemble-v2.2",
                Accuracy = 96.3,
                TotalTransactions = 45280,
                AvgResponseMs = 38,
                FraudDetectedToday = 12,
                LastTrained = "Jun 3 2026",
                ServerUptime = 98.5
            };

            return Ok(ApiResponse<DemoStatusDto>.Ok(status));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching demo status");
            return StatusCode(500, ApiResponse<DemoStatusDto>.Fail("Failed to fetch demo status"));
        }
    }

    /// <summary>
    /// Generate batch test transactions (public endpoint)
    /// </summary>
    [HttpGet("batch-test")]
    public IActionResult GenerateBatchTest([FromQuery] int count = 30, [FromQuery] string? type = null)
    {
        try
        {
            // Clamp count
            count = Math.Min(count, 100);
            if (count < 1) count = 30;

            var transactions = new List<DemoTransactionDto>();

            var merchants = type switch
            {
                "highrisk" => new[] 
                { 
                    ("Crypto Exchange", "CRYPTO"), 
                    ("Online Betting", "GAMBLING"), 
                    ("Luxury Watches", "LUXURY") 
                },
                "electronics" => new[] 
                { 
                    ("Best Buy", "ELECTRONICS"), 
                    ("Amazon Electronics", "ELECTRONICS"), 
                    ("Apple Store", "ELECTRONICS") 
                },
                "normal" => new[] 
                { 
                    ("Starbucks", "RETAIL"), 
                    ("Walmart", "RETAIL"), 
                    ("Target", "RETAIL") 
                },
                _ => new[] 
                { 
                    ("Crypto Exchange", "CRYPTO"), 
                    ("Best Buy", "ELECTRONICS"), 
                    ("Starbucks", "RETAIL"), 
                    ("Amazon", "RETAIL"),
                    ("Luxury Watches", "LUXURY")
                }
            };

            for (int i = 0; i < count; i++)
            {
                var merchant = merchants[Random.Next(merchants.Length)];
                decimal amount = type switch
                {
                    "highrisk" => Random.Next(10000, 80000),
                    "electronics" => Random.Next(2000, 15000),
                    "normal" => Random.Next(50, 500),
                    _ => Random.Next(100, 5000)
                };

                transactions.Add(new DemoTransactionDto
                {
                    TransactionId = $"TXN_{Guid.NewGuid().ToString("N")[..8]}",
                    Merchant = merchant.Item1,
                    Amount = amount,
                    Timestamp = DateTime.UtcNow.AddMinutes(-Random.Next(0, 1440)),
                    Velocity1h = Random.Next(0, 20),
                    Velocity24h = Random.Next(0, 100),
                    MerchantCategory = merchant.Item2
                });
            }

            var response = new BatchTestResponseDto { Transactions = transactions };
            return Ok(ApiResponse<BatchTestResponseDto>.Ok(response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating batch test");
            return StatusCode(500, ApiResponse<BatchTestResponseDto>.Fail("Failed to generate batch test"));
        }
    }
}
