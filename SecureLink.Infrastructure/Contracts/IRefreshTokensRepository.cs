using SecureLink.Core.Entities;

namespace SecureLink.Infrastructure.Contracts;

public interface IRefreshTokensRepository
{
    public Task<bool> AddToken(RefreshToken token);
    public Task<bool> RevokeToken(string token);
    public Task<RefreshToken?> GetToken(string token);
    public Task<bool> RevokeAllTokens(Guid userId);
}
