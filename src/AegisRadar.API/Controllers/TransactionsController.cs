using AegisRadar.Application.DTOs;
using AegisRadar.Application.Features.Transactions.Commands;
using AegisRadar.Application.Features.Transactions.Queries;
using AegisRadar.Domain.Interfaces;
using AegisRadar.Shared.Wrappers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AegisRadar.API.Controllers;

[ApiController]
[Route("api/transactions")]
[Produces("application/json")]
public class TransactionsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IUnitOfWork _uow;
    private readonly ILogger<TransactionsController> _logger;

    public TransactionsController(IMediator mediator, IUnitOfWork uow, ILogger<TransactionsController> logger)
    {
        _mediator = mediator;
        _uow      = uow;
        _logger   = logger;
    }

    /// <summary>
    /// Submit a transaction for real-time fraud analysis.
    /// Requires X-API-Key header. Returns 202 Accepted immediately;
    /// the fraud verdict is processed asynchronously via Kafka.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<TransactionResponseDto>), 202)]
    [ProducesResponseType(401)]
    [ProducesResponseType(429)]
    public async Task<IActionResult> Submit([FromBody] TransactionRequestDto request, CancellationToken ct)
    {
        // Merchant context was populated by ApiKeyMiddleware
        if (!HttpContext.Items.TryGetValue("MerchantId", out var merchantIdObj) || merchantIdObj is not Guid merchantId)
            return Unauthorized(ApiResponse<TransactionResponseDto>.Fail("Missing merchant context."));

        var merchantCountry = HttpContext.Items["MerchantCountry"] as string ?? "EG";
        var planLimit       = (int)(HttpContext.Items["PlanLimit"] ?? 5000);

        // Enforce subscription transaction limit
        if (planLimit > 0)
        {
            var monthlyCount = await _uow.Transactions.GetMonthlyCountByMerchantAsync(merchantId, ct);
            if (monthlyCount >= planLimit)
            {
                _logger.LogWarning("Merchant {MerchantId} exceeded plan limit {Limit}", merchantId, planLimit);
                return StatusCode(429, ApiResponse<TransactionResponseDto>.Fail(
                    $"Monthly transaction limit ({planLimit}) exceeded. Please upgrade your plan."));
            }
        }

        var command = new SubmitTransactionCommand(merchantId, merchantCountry, request);
        var result  = await _mediator.Send(command, ct);

        return StatusCode(202, ApiResponse<TransactionResponseDto>.Ok(result,
            "Transaction accepted. Fraud analysis is processing asynchronously."));
    }

    /// <summary>List transactions for the authenticated merchant (paginated).</summary>
    [HttpGet]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<TransactionResponseDto>>), 200)]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var merchantId = GetMerchantIdFromToken();
        if (merchantId == Guid.Empty) return Unauthorized();

        var result = await _mediator.Send(new GetTransactionsQuery(merchantId, page, pageSize), ct);
        return Ok(ApiResponse<IEnumerable<TransactionResponseDto>>.Ok(result));
    }

    /// <summary>Get a single transaction by ID with prediction details.</summary>
    [HttpGet("{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<TransactionResponseDto>), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var merchantId = GetMerchantIdFromToken();
        var tx = await _uow.Transactions.GetByIdWithDetailsAsync(id, ct);
        if (tx is null || tx.MerchantId != merchantId) return NotFound();

        var response = new TransactionResponseDto(
            tx.Id, tx.MerchantId, tx.CustomerId, tx.Amount, tx.Currency, tx.Country, tx.Mcc,
            tx.Status.ToString(), tx.CreatedAt,
            tx.Prediction == null ? null : new PredictionResponseDto(
                tx.Prediction.FraudProbability, tx.Prediction.Decision.ToString(),
                tx.Prediction.ModelVersion, tx.Prediction.CreatedAt));

        return Ok(ApiResponse<TransactionResponseDto>.Ok(response));
    }

    /// <summary>
    /// Generate demo transactions for testing real-time updates.
    /// This endpoint creates random transactions streamed to Kafka for processing.
    /// </summary>
    [HttpPost("generate-demo")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), 200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> GenerateDemo([FromQuery] int count = 5, CancellationToken ct = default)
    {
        var merchantId = GetMerchantIdFromToken();
        if (merchantId == Guid.Empty) return Unauthorized();

        var random = new Random();
        var currencies = new[] { "USD", "EUR", "GBP", "JPY", "AED" };
        var countries = new[] { "US", "UK", "DE", "FR", "JP", "EG", "AE" };
        var mccs = new[] { 5411, 5412, 5691, 5999, 6010, 6211, 7011 };

        var created = 0;
        for (int i = 0; i < count; i++)
        {
            try
            {
                var request = new TransactionRequestDto(
                    CustomerId: $"DEMO-{Guid.NewGuid().ToString().Substring(0, 8)}",
                    Amount: (decimal)(random.NextDouble() * 5000 + 10),
                    Currency: currencies[random.Next(currencies.Length)],
                    Country: countries[random.Next(countries.Length)],
                    Mcc: mccs[random.Next(mccs.Length)],
                    DeviceId: Guid.NewGuid().ToString(),
                    IpAddress: $"192.168.{random.Next(256)}.{random.Next(256)}"
                );

                var command = new SubmitTransactionCommand(merchantId, "EG", request);
                await _mediator.Send(command, ct);
                created++;

                // Small delay to spread out Kafka events
                await Task.Delay(100, ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to generate demo transaction {Index}", i);
            }
        }

        return Ok(ApiResponse<object>.Ok(
            new { generated = created, requested = count },
            $"{created} transactions generated successfully"));
    }

    private Guid GetMerchantIdFromToken()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                  User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
        return Guid.TryParse(sub, out var id) ? id : Guid.Empty;
    }
}
