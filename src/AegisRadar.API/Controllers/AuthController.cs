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

    /// <summary>Register a new merchant account (receives Starter plan by default).</summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Register([FromBody] RegisterMerchantDto request, CancellationToken ct)
    {
        var result = await _mediator.Send(new RegisterMerchantCommand(request), ct);
        return StatusCode(201, ApiResponse<LoginResponseDto>.Ok(result, "Merchant registered successfully."));
    }
}
