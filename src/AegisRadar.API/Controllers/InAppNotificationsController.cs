using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using AegisRadar.Shared.Wrappers;
using AegisRadar.Shared.DTOs;
using AegisRadar.Domain.Interfaces;

namespace AegisRadar.API.Controllers;

[ApiController]
[Route("api/in-app-notifications")]
[Authorize]
public class InAppNotificationsController(IUnitOfWork unitOfWork, ILogger<InAppNotificationsController> logger) : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork = unitOfWork;
    private readonly ILogger<InAppNotificationsController> _logger = logger;

    /// <summary>
    /// Get the last 50 in-app notifications for the current merchant
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetNotifications(CancellationToken ct)
    {
        try
        {
            var merchantIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(merchantIdClaim, out var merchantId))
            {
                return Unauthorized("Invalid authentication token");
            }

            var notifications = await _unitOfWork.AppNotifications.GetByMerchantIdAsync(merchantId, 50, ct);

            var response = notifications
                .Select(n => new AppNotificationDto
                {
                    Id = n.Id.ToString(),
                    Title = n.Title,
                    Message = n.Message,
                    Type = n.Type,
                    Severity = n.Severity,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt
                })
                .ToList();

            return Ok(ApiResponse<List<AppNotificationDto>>.Ok(response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching notifications");
            return StatusCode(500, ApiResponse<List<AppNotificationDto>>.Fail("Failed to fetch notifications"));
        }
    }

    /// <summary>
    /// Mark a notification as read
    /// </summary>
    [HttpPost("{id}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken ct)
    {
        try
        {
            var merchantIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(merchantIdClaim, out var merchantId))
            {
                return Unauthorized("Invalid authentication token");
            }

            var notification = await _unitOfWork.AppNotifications.GetByIdAsync(id, ct);
            if (notification is null)
            {
                return NotFound("Notification not found");
            }

            // Verify ownership
            if (notification.MerchantId != merchantId)
            {
                return Forbid("Cannot mark notifications from other merchants");
            }

            notification.IsRead = true;
            await _unitOfWork.SaveChangesAsync(ct);

            var response = new { message = "Marked as read" };
            return Ok(ApiResponse<object>.Ok(response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking notification as read");
            return StatusCode(500, ApiResponse<object>.Fail("Failed to mark notification as read"));
        }
    }
}
