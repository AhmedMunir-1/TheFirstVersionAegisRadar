using AegisRadar.Domain.Entities;
using AegisRadar.Domain.Interfaces;
using AegisRadar.Shared.DTOs;
using AegisRadar.Shared.Wrappers;
using Microsoft.AspNetCore.Mvc;
using System.Security.Cryptography;
using System.Text;

namespace AegisRadar.API.Controllers;

[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    private readonly ITokenService _tokenService;

    public AuthController(IUnitOfWork uow, ITokenService tokenService)
    {
        _uow = uow;
        _tokenService = tokenService;
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), 200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request, CancellationToken ct)
    {
        var merchant = await _uow.Merchants.GetByEmailAsync(request.Email.Trim().ToLowerInvariant(), ct);
        if (merchant is null || merchant.PasswordHash != HashPassword(request.Password))
            return Unauthorized(ApiResponse<LoginResponseDto>.Fail("Invalid email or password."));

        var token = _tokenService.GenerateJwtToken(merchant);
        var response = new LoginResponseDto
        {
            Token = token,
            MerchantId = merchant.Id,
            Email = merchant.Email,
            CompanyName = merchant.CompanyName
        };

        return Ok(ApiResponse<LoginResponseDto>.Ok(response, "Login successful."));
    }

    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<RegisterResultDto>), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Register([FromBody] RegisterMerchantDto request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password) || string.IsNullOrWhiteSpace(request.CompanyName))
            return BadRequest(ApiResponse<RegisterResultDto>.Fail("Company name, email, and password are required."));

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var existingMerchant = await _uow.Merchants.GetByEmailAsync(normalizedEmail, ct);
        if (existingMerchant is not null)
            return BadRequest(ApiResponse<RegisterResultDto>.Fail("Email is already registered."));

        var merchant = new Merchant
        {
            CompanyName = request.CompanyName.Trim(),
            Email = normalizedEmail,
            PasswordHash = HashPassword(request.Password),
            Country = string.IsNullOrWhiteSpace(request.Country) ? "EG" : request.Country.Trim(),
            ApiKey = Guid.NewGuid().ToString("N"),
            Role = "Admin",
            IsEmailConfirmed = true,
            CreatedAt = DateTime.UtcNow
        };

        await _uow.Merchants.AddAsync(merchant, ct);
        await _uow.SaveChangesAsync(ct);

        var token = _tokenService.GenerateJwtToken(merchant);
        var response = new RegisterResultDto
        {
            MerchantId = merchant.Id,
            Email = merchant.Email,
            CompanyName = merchant.CompanyName,
            Token = token
        };

        return StatusCode(201, ApiResponse<RegisterResultDto>.Ok(response, "Merchant registered successfully."));
    }

    private static string HashPassword(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes);
    }
}
