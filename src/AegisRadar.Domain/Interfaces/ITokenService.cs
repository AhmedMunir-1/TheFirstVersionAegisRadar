using AegisRadar.Domain.Entities;

namespace AegisRadar.Domain.Interfaces;

public interface ITokenService
{
    string GenerateJwtToken(Merchant merchant, int expiryHours = 8);
}
