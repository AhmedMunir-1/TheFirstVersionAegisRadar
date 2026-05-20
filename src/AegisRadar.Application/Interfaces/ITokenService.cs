using AegisRadar.Application.DTOs;

namespace AegisRadar.Application.Interfaces;

public interface ITokenService
{
    string GenerateToken(Guid merchantId, string email, string companyName, string role);
}
