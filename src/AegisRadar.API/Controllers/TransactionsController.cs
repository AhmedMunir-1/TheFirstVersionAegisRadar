using AegisRadar.Domain.Entities;
using AegisRadar.Domain.Enums;
using AegisRadar.Domain.Interfaces;
using AegisRadar.Shared.DTOs;
using AegisRadar.Shared.Events;
using AegisRadar.Shared.Wrappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AegisRadar.API.Controllers;

[ApiController]
[Route("api/transactions")]
[Produces("application/json")]
public class TransactionsController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    private readonly IKafkaProducer _kafkaProducer;
    private readonly ILogger<TransactionsController> _logger;

    public TransactionsController(IUnitOfWork uow, IKafkaProducer kafkaProducer, ILogger<TransactionsController> logger)
    {
        _uow = uow;
        _kafkaProducer = kafkaProducer;
        _logger = logger;
    }

    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<TransactionResponseDto>), 202)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> Submit([FromBody] TransactionRequestDto request, CancellationToken ct)
    {
        var merchantId = GetMerchantIdFromToken();
        if (merchantId == Guid.Empty)
            return Unauthorized(ApiResponse<TransactionResponseDto>.Fail("Invalid or missing JWT token."));

        var merchant = await _uow.Merchants.GetByIdAsync(merchantId, ct);
        if (merchant is null)
            return Unauthorized(ApiResponse<TransactionResponseDto>.Fail("Merchant not found."));

        var transaction = new Transaction
        {
            MerchantId = merchant.Id,
            CustomerId = request.CustomerId,
            Amount = request.Amount,
            Currency = string.IsNullOrWhiteSpace(request.Currency) ? "USD" : request.Currency,
            Country = request.TransactionCountry,
            MerchantCountry = merchant.Country,
            Mcc = request.Mcc,
            DeviceId = request.DeviceId,
            IpAddress = request.IpAddress,
            Status = TransactionStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        await _uow.Transactions.AddAsync(transaction, ct);
        await _uow.SaveChangesAsync(ct);

        var transactionEvent = new TransactionCreatedEvent
        {
            TransactionId = transaction.Id,
            MerchantId = transaction.MerchantId,
            CustomerId = transaction.CustomerId,
            Amount = transaction.Amount,
            Currency = transaction.Currency,
            TransactionCountry = transaction.Country,
            MerchantCountry = transaction.MerchantCountry,
            Mcc = transaction.Mcc,
            DeviceId = transaction.DeviceId,
            IpAddress = transaction.IpAddress,
            CreatedAt = transaction.CreatedAt
        };

        await _kafkaProducer.PublishTransactionCreatedAsync(transactionEvent, ct);

        var response = new TransactionResponseDto
        {
            Id = transaction.Id,
            MerchantId = transaction.MerchantId,
            CustomerId = transaction.CustomerId,
            Amount = transaction.Amount,
            Currency = transaction.Currency,
            Status = transaction.Status.ToString(),
            TransactionCountry = transaction.Country,
            MerchantCountry = transaction.MerchantCountry,
            Mcc = transaction.Mcc,
            DeviceId = transaction.DeviceId,
            IpAddress = transaction.IpAddress,
            CreatedAt = transaction.CreatedAt,
            Prediction = null
        };

        return StatusCode(202, ApiResponse<TransactionResponseDto>.Ok(response,
            "Transaction accepted. Fraud analysis is processing asynchronously."));
    }

    [HttpGet]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<TransactionResponseDto>>), 200)]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var merchantId = GetMerchantIdFromToken();
        if (merchantId == Guid.Empty) return Unauthorized();

        var transactions = await _uow.Transactions.GetByMerchantIdAsync(merchantId, page, pageSize, ct);
        var response = transactions.Select(tx => new TransactionResponseDto
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

    [HttpGet("{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<TransactionResponseDto>), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var merchantId = GetMerchantIdFromToken();
        var tx = await _uow.Transactions.GetByIdWithDetailsAsync(id, ct);
        if (tx is null || tx.MerchantId != merchantId) return NotFound();

        var response = new TransactionResponseDto
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
        };

        return Ok(ApiResponse<TransactionResponseDto>.Ok(response));
    }

    [HttpPatch("{id:guid}/review")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<TransactionResponseDto>), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> ReviewTransaction(Guid id, [FromBody] ReviewDecisionDto decision, CancellationToken ct)
    {
        var merchantId = GetMerchantIdFromToken();
        if (merchantId == Guid.Empty) return Unauthorized();

        var tx = await _uow.Transactions.GetByIdWithDetailsAsync(id, ct);
        if (tx is null || tx.MerchantId != merchantId) return NotFound();

        if (tx.Status != TransactionStatus.Review)
            return BadRequest(ApiResponse<TransactionResponseDto>.Fail("Only Review transactions can be actioned."));

        tx.Status = decision.Decision.Equals("approve", StringComparison.OrdinalIgnoreCase)
            ? TransactionStatus.Approved
            : TransactionStatus.Blocked;

        if (tx.Prediction != null)
        {
            tx.Prediction.Decision = decision.Decision.Equals("approve", StringComparison.OrdinalIgnoreCase)
                ? FraudDecision.Approved
                : FraudDecision.Blocked;
            tx.Prediction.AdminOverride = true;
            tx.Prediction.AdminNote = decision.Note;
            tx.Prediction.ReviewedAt = DateTime.UtcNow;
        }

        _uow.Transactions.Update(tx);
        await _uow.SaveChangesAsync(ct);

        var response = new TransactionResponseDto
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
        };

        return Ok(ApiResponse<TransactionResponseDto>.Ok(response, "Transaction review processed."));
    }

    [HttpPatch("{id:guid}/decision")]
    [Authorize]
    public async Task<IActionResult> ManualDecision(
        Guid id,
        [FromBody] ManualDecisionDto dto,
        CancellationToken ct)
    {
        var merchantId = GetMerchantIdFromToken();
        if (merchantId == Guid.Empty) return Unauthorized();

        var tx = await _uow.Transactions.GetByIdWithDetailsAsync(id, ct);
        if (tx is null || tx.MerchantId != merchantId)
            return NotFound(ApiResponse<bool>.Fail("Transaction not found."));




        tx.Status = dto.Decision == "Approved"
            ? Domain.Enums.TransactionStatus.Approved
            : Domain.Enums.TransactionStatus.Blocked;

        await _uow.SaveChangesAsync(ct);

        var response = new TransactionResponseDto
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
        };

        return Ok(ApiResponse<TransactionResponseDto>.Ok(
            response, $"Transaction {dto.Decision} successfully."));
    }

    [HttpPost("generate-demo")]
    [Authorize]
    public async Task<IActionResult> GenerateDemo(
        [FromQuery] int count = 10,
        CancellationToken ct = default)
    {
        var merchantId = GetMerchantIdFromToken();
        if (merchantId == Guid.Empty) return Unauthorized();

        var random = new Random();
        var currencies = new[] { "USD", "EUR", "EGP", "GBP" };
        var countries  = new[] { "EG", "US", "DE", "FR", "AE", "UK" };
        var mccs       = new[] { 5411, 5812, 4829, 7011, 5912, 6011, 7995 };

        var created = 0;
        for (int i = 0; i < Math.Min(count, 20); i++)
        {
            try
            {
                var request = new TransactionRequestDto
                {
                    CustomerId = $"DEMO-{Guid.NewGuid().ToString()[..8]}",
                    Amount = (decimal)(random.NextDouble() * 5000 + 10),
                    Currency = currencies[random.Next(currencies.Length)],
                    TransactionCountry = countries[random.Next(countries.Length)],
                    Mcc = mccs[random.Next(mccs.Length)],
                    DeviceId = Guid.NewGuid().ToString(),
                    IpAddress = $"192.168.{random.Next(256)}.{random.Next(256)}"
                };

                await Submit(request, ct);
                created++;
                await Task.Delay(200, ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to generate demo transaction {Index}", i);
            }
        }

        return Ok(ApiResponse<object>.Ok(
            new { generated = created, requested = count },
            $"{created} demo transactions submitted successfully"));
    }

    private Guid GetMerchantIdFromToken()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                  User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
        return Guid.TryParse(sub, out var id) ? id : Guid.Empty;
    }
}
