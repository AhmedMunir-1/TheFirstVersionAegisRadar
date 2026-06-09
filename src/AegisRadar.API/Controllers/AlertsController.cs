using AegisRadar.Domain.Interfaces;
using AegisRadar.Shared.DTOs;
using AegisRadar.Shared.Wrappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AegisRadar.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AlertsController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<AlertsController> _logger;

    public AlertsController(IUnitOfWork unitOfWork, ILogger<AlertsController> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    /// <summary>Get all alerts for the current merchant.</summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<AlertDto>>>> GetAlerts(CancellationToken cancellationToken = default)
    {
        try
        {
            var merchantIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(merchantIdClaim, out var merchantId))
            {
                return Unauthorized(ApiResponse<IEnumerable<AlertDto>>.Fail("Invalid merchant ID in token"));
            }

            var alerts = await _unitOfWork.Alerts.GetByMerchantIdAsync(merchantId, cancellationToken: cancellationToken);

            var alertDtos = alerts.Select(a => new AlertDto
            {
                Id = a.Id,
                MerchantId = a.MerchantId,
                TransactionId = a.TransactionId,
                Severity = a.Severity.ToString(),
                Message = a.Message,
                IsRead = a.IsRead,
                CreatedAt = a.CreatedAt
            }).ToList();

            return Ok(ApiResponse<IEnumerable<AlertDto>>.Ok(alertDtos, "Alerts retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get alerts");
            return StatusCode(500, ApiResponse<IEnumerable<AlertDto>>.Fail("Failed to retrieve alerts"));
        }
    }

    /// <summary>Mark a specific alert as read.</summary>
    [HttpPut("{id}/read")]
    public async Task<ActionResult<ApiResponse<object>>> MarkAlertAsRead(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var merchantIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(merchantIdClaim, out var merchantId))
            {
                return Unauthorized(ApiResponse<object>.Fail("Invalid merchant ID in token"));
            }

            var alert = await _unitOfWork.Alerts.GetByIdAsync(id, cancellationToken);
            if (alert is null)
            {
                return NotFound(ApiResponse<object>.Fail("Alert not found"));
            }

            if (alert.MerchantId != merchantId)
            {
                return Forbid();
            }

            alert.IsRead = true;
            _unitOfWork.Alerts.Update(alert);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Alert {AlertId} marked as read for merchant {MerchantId}", id, merchantId);
            return Ok(ApiResponse<object>.Ok(new { }, "Alert marked as read"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to mark alert as read");
            return StatusCode(500, ApiResponse<object>.Fail("Failed to mark alert as read"));
        }
    }

    /// <summary>Mark all alerts as read for the current merchant.</summary>
    [HttpPut("read-all")]
    public async Task<ActionResult<ApiResponse<object>>> MarkAllAlertsAsRead(CancellationToken cancellationToken = default)
    {
        try
        {
            var merchantIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(merchantIdClaim, out var merchantId))
            {
                return Unauthorized(ApiResponse<object>.Fail("Invalid merchant ID in token"));
            }

            await _unitOfWork.Alerts.MarkAllAlertsReadAsync(merchantId, cancellationToken);

            _logger.LogInformation("All alerts marked as read for merchant {MerchantId}", merchantId);
            return Ok(ApiResponse<object>.Ok(new { }, "All alerts marked as read"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to mark all alerts as read");
            return StatusCode(500, ApiResponse<object>.Fail("Failed to mark all alerts as read"));
        }
    }

    /// <summary>Get the count of unread alerts for the current merchant.</summary>
    [HttpGet("unread-count")]
    public async Task<ActionResult<ApiResponse<int>>> GetUnreadCount(CancellationToken cancellationToken = default)
    {
        try
        {
            var merchantIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(merchantIdClaim, out var merchantId))
            {
                return Unauthorized(ApiResponse<int>.Fail("Invalid merchant ID in token"));
            }

            var count = await _unitOfWork.Alerts.GetUnreadCountAsync(merchantId, cancellationToken);
            return Ok(ApiResponse<int>.Ok(count, "Unread count retrieved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get unread count");
            return StatusCode(500, ApiResponse<int>.Fail("Failed to retrieve unread count"));
        }
    }
}
