namespace AegisRadar.Application.DTOs;

public record RegisterResultDto(Guid MerchantId, string Message);

public record VerifyEmailRequestDto(string Email, string Code);

public record ForgotPasswordRequestDto(string Email);

public record ResetPasswordRequestDto(string Email, string Code, string NewPassword);
