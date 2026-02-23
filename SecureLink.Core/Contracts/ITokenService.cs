using SecureLink.Core.Entities;

namespace SecureLink.Core.Contracts;

public interface ITokenService
{
    string GenerateAccessToken(Guid userId);
    Task<string> GenerateRefreshToken(Guid userId);
    public Task<bool> RevokeToken(string refreshToken);
    public Task<bool> RevokeAllTokens(Guid userId);
}
