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
    private readonly IDemoTransactionGenerator _demoTransactionGenerator;

    public LoginCommandHandler(IUnitOfWork uow, ITokenService tokenService, IDemoTransactionGenerator demoTransactionGenerator)
    {
        _uow = uow;
        _tokenService = tokenService;
        _demoTransactionGenerator = demoTransactionGenerator;
    }

    public async Task<LoginResponseDto?> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var merchant = await _uow.Merchants.GetByEmailAsync(request.Request.Email, cancellationToken);
        if (merchant is null) return null;

        var hash = HashPassword(request.Request.Password);
        if (merchant.PasswordHash != hash) return null;

        await TryGenerateDemoTransactionsAsync(merchant, cancellationToken);

        var token = _tokenService.GenerateToken(merchant.Id, merchant.Email, merchant.CompanyName, merchant.Role);
        var expires = DateTime.UtcNow.AddHours(8);
        return new LoginResponseDto(token, merchant.Email, merchant.CompanyName, merchant.Role, expires);
    }

    private async Task TryGenerateDemoTransactionsAsync(Merchant merchant, CancellationToken cancellationToken)
    {
        try
        {
            await _demoTransactionGenerator.GenerateTransactionsForMerchantAsync(merchant, 5, cancellationToken);
        }
        catch
        {
            // Do not prevent login if demo generation fails.
        }
    }


     private static string HashPassword(string password)
     {

       var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));   
       return Convert.ToHexString(bytes);

     }


}

// ─── Register ────────────────────────────────────────────────────────────────


public record RegisterMerchantCommand(RegisterMerchantDto Request) : IRequest<RegisterResultDto?>;
public class RegisterMerchantCommandHandler : IRequestHandler<RegisterMerchantCommand, RegisterResultDto?>
{

    private readonly IUnitOfWork _uow;
    private readonly ITokenService _tokenService;
    private readonly IEmailService _emailService;

    public RegisterMerchantCommandHandler(IUnitOfWork uow, ITokenService tokenService, IEmailService emailService)
    {
    
        _uow          = uow;
        _tokenService = tokenService;
        _emailService = emailService;

    }


    public async Task<RegisterResultDto?> Handle(RegisterMerchantCommand request, CancellationToken cancellationToken)
    {
        var existing = await _uow.Merchants.GetByEmailAsync(request.Request.Email, cancellationToken);
        if (existing != null) return null;

        var verificationCode = new Random().Next(100000, 999999).ToString();

        var merchant = new Merchant
        {
            CompanyName  = request.Request.CompanyName,
            Email        = request.Request.Email,
            PasswordHash = HashPassword(request.Request.Password),
            Country      = request.Request.Country,
            PlanId       = Guid.Parse("11111111-0000-0000-0000-000000000001"), // Default to Starter Plan
            ApiKey       = GenerateApiKey(),
            Role         = "Admin",
            IsEmailConfirmed = false,
            EmailVerificationCode = verificationCode,
            EmailVerificationExpires = DateTime.UtcNow.AddMinutes(30)
        };

        await _uow.Merchants.AddAsync(merchant, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        // send verification email
        var subject = "Verify your AegisRadar account";
        var body = $"<p>Hi {merchant.CompanyName},</p><p>Your verification code is: <strong>{verificationCode}</strong></p><p>This code expires in 30 minutes.</p>";
        await _emailService.SendEmailAsync(merchant.Email, subject, body, cancellationToken);

        return new RegisterResultDto(merchant.Id, "Verification code sent to email. Please verify to complete registration.");

    }



    private static string HashPassword(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes);
    }



    private static string GenerateApiKey() =>
        $"ar_{Convert.ToHexString(RandomNumberGenerator.GetBytes(16)).ToLower()}";


}

// ─── Email verification / password reset commands ───────────────────────

public record VerifyEmailCommand(VerifyEmailRequestDto Request) : IRequest<LoginResponseDto?>;
public class VerifyEmailCommandHandler : IRequestHandler<VerifyEmailCommand, LoginResponseDto?>
{
    private readonly IUnitOfWork _uow;
    private readonly ITokenService _tokenService;

    public VerifyEmailCommandHandler(IUnitOfWork uow, ITokenService tokenService)
    {
        _uow = uow;
        _tokenService = tokenService;
    }

    public async Task<LoginResponseDto?> Handle(VerifyEmailCommand request, CancellationToken cancellationToken)
    {
        var merchant = await _uow.Merchants.GetByEmailAsync(request.Request.Email, cancellationToken);
        if (merchant is null) return null;

        if (merchant.EmailVerificationCode != request.Request.Code) return null;
        if (merchant.EmailVerificationExpires is null || merchant.EmailVerificationExpires < DateTime.UtcNow) return null;

        merchant.IsEmailConfirmed = true;
        merchant.EmailVerificationCode = null;
        merchant.EmailVerificationExpires = null;
        await _uow.SaveChangesAsync(cancellationToken);

        var token = _tokenService.GenerateToken(merchant.Id, merchant.Email, merchant.CompanyName, merchant.Role);
        return new LoginResponseDto(token, merchant.Email, merchant.CompanyName, merchant.Role, DateTime.UtcNow.AddHours(8));
    }
}

public record ForgotPasswordCommand(ForgotPasswordRequestDto Request) : IRequest<bool>;
public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand, bool>
{
    private readonly IUnitOfWork _uow;
    private readonly IEmailService _emailService;

    public ForgotPasswordCommandHandler(IUnitOfWork uow, IEmailService emailService)
    {
        _uow = uow;
        _emailService = emailService;
    }

    public async Task<bool> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var merchant = await _uow.Merchants.GetByEmailAsync(request.Request.Email, cancellationToken);
        if (merchant is null) return false;

        var resetCode = new Random().Next(100000, 999999).ToString();
        merchant.PasswordResetCode = resetCode;
        merchant.PasswordResetExpires = DateTime.UtcNow.AddMinutes(30);
        await _uow.SaveChangesAsync(cancellationToken);

        var subject = "Reset your AegisRadar password";
        var body = $"<p>Hi {merchant.CompanyName},</p><p>Your password reset code is: <strong>{resetCode}</strong></p><p>This code expires in 30 minutes.</p>";
        await _emailService.SendEmailAsync(merchant.Email, subject, body, cancellationToken);
        return true;
    }
}

public record ResetPasswordCommand(ResetPasswordRequestDto Request) : IRequest<bool>;
public class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand, bool>
{
    private readonly IUnitOfWork _uow;

    public ResetPasswordCommandHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<bool> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var merchant = await _uow.Merchants.GetByEmailAsync(request.Request.Email, cancellationToken);
        if (merchant is null) return false;

        if (merchant.PasswordResetCode != request.Request.Code) return false;
        if (merchant.PasswordResetExpires is null || merchant.PasswordResetExpires < DateTime.UtcNow) return false;

        merchant.PasswordHash = HashPassword(request.Request.NewPassword);
        merchant.PasswordResetCode = null;
        merchant.PasswordResetExpires = null;
        await _uow.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static string HashPassword(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes);
    }
}
