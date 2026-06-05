using AegisRadar.Application.Features.Auth.Commands;
using AegisRadar.Application.DTOs;
using AegisRadar.Shared.Wrappers;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace AegisRadar.API.Controllers;

[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator) => _mediator = mediator;

    /// <summary>Authenticate a merchant and receive a JWT token.</summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), 200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request, CancellationToken ct)
    {
        var result = await _mediator.Send(new LoginCommand(request), ct);
        if (result is null)
            return Unauthorized(ApiResponse<LoginResponseDto>.Fail("Invalid email or password."));

        return Ok(ApiResponse<LoginResponseDto>.Ok(result, "Login successful."));
    }

    /// <summary>Register a new merchant account (sends verification code to email).</summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<RegisterResultDto>), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Register([FromBody] RegisterMerchantDto request, CancellationToken ct)
    {
        var result = await _mediator.Send(new RegisterMerchantCommand(request), ct);
        if (result is null)
            return BadRequest(ApiResponse<RegisterResultDto>.Fail("Registration failed. Email might already be in use."));

        return StatusCode(201, ApiResponse<RegisterResultDto>.Ok(result, "Verification code sent to email."));
    }

    /// <summary>Verify email with code and receive JWT token.</summary>
    [HttpPost("verify")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), 200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Verify([FromBody] VerifyEmailRequestDto request, CancellationToken ct)
    {
        var result = await _mediator.Send(new VerifyEmailCommand(request), ct);
        if (result is null)
            return BadRequest(ApiResponse<LoginResponseDto>.Fail("Invalid verification code or expired."));

        return Ok(ApiResponse<LoginResponseDto>.Ok(result, "Email verified. Logged in."));
    }

    /// <summary>Request a password reset code to be sent to email.</summary>
    [HttpPost("forgot-password")]
    [ProducesResponseType(typeof(ApiResponse<bool>), 200)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto request, CancellationToken ct)
    {
        var result = await _mediator.Send(new ForgotPasswordCommand(request), ct);
        return Ok(ApiResponse<bool>.Ok(result, result ? "Reset code sent." : "Email not found."));
    }

    /// <summary>Reset password using code sent to email.</summary>
    [HttpPost("reset-password")]
    [ProducesResponseType(typeof(ApiResponse<bool>), 200)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto request, CancellationToken ct)
    {
        var result = await _mediator.Send(new ResetPasswordCommand(request), ct);
        return Ok(ApiResponse<bool>.Ok(result, result ? "Password reset successful." : "Invalid code or expired."));
    }
}
