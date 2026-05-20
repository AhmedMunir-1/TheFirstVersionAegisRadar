using AegisRadar.Application.DTOs;
using AegisRadar.Application.Interfaces;
using AegisRadar.Domain.Entities;
using AegisRadar.Domain.Interfaces;
using MediatR;
using System.Security.Cryptography;
using System.Text;

namespace AegisRadar.Application.Features.Auth.Commands;

// ─── Login ───────────────────────────────────────────────────────────────────

public record LoginCommand(LoginRequestDto Request) : IRequest<LoginResponseDto?>;

public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResponseDto?>
{
 
     private readonly IUnitOfWork _uow;
     private readonly ITokenService _tokenService;

     public LoginCommandHandler(IUnitOfWork uow, ITokenService tokenService)
     {
    
        _uow          = uow;
        _tokenService = tokenService;

     }


     public async Task<LoginResponseDto?> Handle(LoginCommand request, CancellationToken cancellationToken)
     {
        
        var merchant = await _uow.Merchants.GetByEmailAsync(request.Request.Email, cancellationToken);
        if (merchant is null) return null;

        var hash = HashPassword(request.Request.Password);
        if (merchant.PasswordHash != hash) return null;

        var token   = _tokenService.GenerateToken(merchant.Id, merchant.Email, merchant.CompanyName, merchant.Role);
        var expires = DateTime.UtcNow.AddHours(8);
        return new LoginResponseDto(token, merchant.Email, merchant.CompanyName, merchant.Role, expires);
     }


     private static string HashPassword(string password)
     {

       var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));   
       return Convert.ToHexString(bytes);

     }


}

// ─── Register ────────────────────────────────────────────────────────────────


public record RegisterMerchantCommand(RegisterMerchantDto Request) : IRequest<LoginResponseDto>;
public class RegisterMerchantCommandHandler : IRequestHandler<RegisterMerchantCommand, LoginResponseDto>
{

    private readonly IUnitOfWork _uow;
    private readonly ITokenService _tokenService;

    public RegisterMerchantCommandHandler(IUnitOfWork uow, ITokenService tokenService)
    {
    
        _uow          = uow;
         _tokenService = tokenService;

    }


    public async Task<LoginResponseDto> Handle(RegisterMerchantCommand request, CancellationToken cancellationToken)
    {

        // Get Starter plan (default)
        var starterPlan = (await _uow.Merchants.GetAllAsync(cancellationToken)).FirstOrDefault();

        var merchant = new Merchant
        {
            CompanyName  = request.Request.CompanyName,
            Email        = request.Request.Email,
            PasswordHash = HashPassword(request.Request.Password),
            Country      = request.Request.Country,
            ApiKey       = GenerateApiKey(),
            Role         = "Admin"
        };

        await _uow.Merchants.AddAsync(merchant, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        var token = _tokenService.GenerateToken(merchant.Id, merchant.Email, merchant.CompanyName, merchant.Role);
        return new LoginResponseDto(token, merchant.Email, merchant.CompanyName, merchant.Role, DateTime.UtcNow.AddHours(8));

    }



    private static string HashPassword(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes);
    }



    private static string GenerateApiKey() =>
        $"ar_{Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)).Replace("/", "").Replace("+", "").Replace("=", "")[..32]}"
        ;


}
