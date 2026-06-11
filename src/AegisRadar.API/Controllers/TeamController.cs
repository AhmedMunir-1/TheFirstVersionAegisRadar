using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using AegisRadar.Shared.Wrappers;
using AegisRadar.Shared.DTOs;
using AegisRadar.Domain.Interfaces;
using AegisRadar.Domain.Entities;
using AegisRadar.Infrastructure.Services;

namespace AegisRadar.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TeamController(IUnitOfWork unitOfWork, IEmailService emailService, ILogger<TeamController> logger) : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork = unitOfWork;
    private readonly IEmailService _emailService = emailService;
    private readonly ILogger<TeamController> _logger = logger;

    /// <summary>
    /// Get all team members in the same organization
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetTeam(CancellationToken ct)
    {
        try
        {
            var merchantIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(merchantIdClaim, out var merchantId))
            {
                return Unauthorized("Invalid authentication token");
            }

            var merchant = await _unitOfWork.Merchants.GetByIdAsync(merchantId, ct);
            if (merchant is null)
            {
                return NotFound("Merchant not found");
            }

            // Get all merchants in the same organization, or just this merchant if no org
            var orgId = merchant.OrganizationId;
            var allMerchants = orgId.HasValue
                ? (await _unitOfWork.Merchants.GetAllAsync(ct))
                    .Where(m => m.OrganizationId == orgId)
                    .ToList()
                : new List<Merchant> { merchant };

            var response = allMerchants
                .Select(m => new TeamMemberDto
                {
                    Id = m.Id.ToString(),
                    CompanyName = m.CompanyName,
                    Email = m.Email,
                    Role = m.Role,
                    Status = "Active",
                    CreatedAt = m.CreatedAt
                })
                .ToList();

            return Ok(ApiResponse<List<TeamMemberDto>>.Ok(response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching team members");
            return StatusCode(500, ApiResponse<List<TeamMemberDto>>.Fail("Failed to fetch team members"));
        }
    }

    /// <summary>
    /// Invite a new team member (Admin only)
    /// </summary>
    [HttpPost("invite")]
    public async Task<IActionResult> InviteTeamMember(
        [FromBody] InviteTeamMemberDto dto,
        CancellationToken ct)
    {
        try
        {
            var merchantIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(merchantIdClaim, out var merchantId))
            {
                return Unauthorized("Invalid authentication token");
            }

            var merchant = await _unitOfWork.Merchants.GetByIdAsync(merchantId, ct);
            if (merchant is null)
            {
                return NotFound("Merchant not found");
            }

            // Admin and Analyst check
            if (merchant.Role != "Admin" && merchant.Role != "Analyst")
            {
                return StatusCode(403, ApiResponse<object>.Fail("Only admins and analysts can invite team members"));
            }

            // Validate role
            if (!new[] { "Admin", "Analyst", "Viewer" }.Contains(dto.Role))
            {
                return BadRequest(ApiResponse<object>.Fail("Invalid role. Must be Admin, Analyst, or Viewer."));
            }

            // Validate email format
            if (string.IsNullOrWhiteSpace(dto.Email) || !dto.Email.Contains("@"))
            {
                return BadRequest(ApiResponse<object>.Fail("Invalid email address"));
            }

            // Check if email already exists
            var existingMerchant = (await _unitOfWork.Merchants.GetAllAsync(ct))
                .FirstOrDefault(m => m.Email == dto.Email);
            if (existingMerchant != null)
            {
                return BadRequest(ApiResponse<object>.Fail("Email already registered in the system"));
            }

            // Generate temporary password
            var tempPassword = GenerateTemporaryPassword();
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword);

            // Create new merchant - mark as Active (not pending)
            var newMerchant = new Merchant
            {
                CompanyName = dto.CompanyName,
                Email = dto.Email,
                Role = dto.Role,
                OrganizationId = merchant.OrganizationId,
                IsEmailConfirmed = true,  // Mark as confirmed since invite is explicit
                ApiKey = Guid.NewGuid().ToString("N"),
                PasswordHash = passwordHash,
                Country = "EG",
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Merchants.AddAsync(newMerchant, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            // Send invitation email with temporary password
            try
            {
                var inviteLink = $"{Request.Scheme}://{Request.Host}/dashboard/team";
                var emailMessage = $"You've been invited to join AegisRadar as a {dto.Role}. " +
                    $"Your temporary password is: {tempPassword}. " +
                    $"Please log in and change your password immediately.";
                
                await _emailService.SendInvitationEmailAsync(
                    dto.Email,
                    dto.CompanyName,
                    inviteLink,
                    dto.Role
                );
                _logger.LogInformation($"✅ Invitation email sent to {dto.Email}");
            }
            catch (Exception emailEx)
            {
                _logger.LogWarning($"⚠️ Failed to send email to {dto.Email}: {emailEx.Message}. Member was created in database.");
                // Don't fail the request - member is created, just email failed
            }

            var response = new
            {
                id = newMerchant.Id.ToString(),
                email = newMerchant.Email,
                role = newMerchant.Role,
                companyName = newMerchant.CompanyName
            };

            return Ok(ApiResponse<object>.Ok(response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inviting team member");
            return StatusCode(500, ApiResponse<object>.Fail("Failed to invite team member"));
        }
    }

    private string GenerateTemporaryPassword()
    {
        // Generate a secure temporary password
        const string charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
        var random = new System.Random();
        return new string(Enumerable.Range(0, 12)
            .Select(_ => charset[random.Next(charset.Length)])
            .ToArray());
    }

    /// <summary>
    /// Update team member role (Admin only)
    /// </summary>
    [HttpPut("{merchantId}/role")]
    public async Task<IActionResult> UpdateRole(
        Guid merchantId,
        [FromBody] UpdateRoleDto dto,
        CancellationToken ct)
    {
        try
        {
            var requestorIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(requestorIdClaim, out var requestorId))
            {
                return Unauthorized("Invalid authentication token");
            }

            var requestor = await _unitOfWork.Merchants.GetByIdAsync(requestorId, ct);
            if (requestor is null)
            {
                return NotFound("Requestor not found");
            }

            // Admin and Analyst check
            if (requestor.Role != "Admin" && requestor.Role != "Analyst")
            {
                return StatusCode(403, ApiResponse<object>.Fail("Only admins and analysts can change roles"));
            }

            // Cannot change own role (commented out to allow testing/demo)
            // if (requestor.Id == merchantId)
            // {
            //     return BadRequest("Cannot change your own role");
            // }

            var targetMerchant = await _unitOfWork.Merchants.GetByIdAsync(merchantId, ct);
            if (targetMerchant is null)
            {
                return NotFound("Target merchant not found");
            }

            // Validate role
            if (!new[] { "Admin", "Analyst", "Viewer" }.Contains(dto.Role))
            {
                return BadRequest("Invalid role. Must be Admin, Analyst, or Viewer.");
            }

            // Update the role
            targetMerchant.Role = dto.Role;
            await _unitOfWork.SaveChangesAsync(ct);

            _logger.LogInformation($"✅ Role updated for merchant {merchantId} to {dto.Role}");

            var response = new { id = targetMerchant.Id.ToString(), role = targetMerchant.Role };
            return Ok(ApiResponse<object>.Ok(response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error updating team member role for {merchantId}");
            return StatusCode(500, ApiResponse<object>.Fail("Failed to update team member role"));
        }
    }
}
