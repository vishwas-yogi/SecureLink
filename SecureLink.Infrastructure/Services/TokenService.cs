using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration.UserSecrets;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SecureLink.Core.Contracts;
using SecureLink.Core.Entities;
using SecureLink.Infrastructure.Contracts;

namespace SecureLink.Infrastructure.Services;

public class TokenService(
    IRefreshTokensRepository refreshTokensRepository,
    IOptions<JwtSettings> jwtSettings,
    ILogger<TokenService> logger
) : ITokenService
{
    // TODO: Add error handling
    private readonly IRefreshTokensRepository _repository = refreshTokensRepository;
    private readonly JwtSettings _jwtSettings = jwtSettings.Value;
    private readonly ILogger<TokenService> _logger = logger;

    public string GenerateAccessToken(Guid userId)
    {
        var claims = new List<Claim>
        {
            new(
                Microsoft.IdentityModel.JsonWebTokens.JwtRegisteredClaimNames.Sub,
                userId.ToString()
            ),
            new(
                Microsoft.IdentityModel.JsonWebTokens.JwtRegisteredClaimNames.Jti,
                Guid.NewGuid().ToString()
            ),
            new(ClaimTypes.Role, "user"), // TODO: add roles to user and in the token
            // But first, I'll have to figure out what authorization pattern would best suit our needs
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Issuer = _jwtSettings.Issuer,
            Audience = _jwtSettings.Audience,
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationInMinutes),
            SigningCredentials = credentials,
        };

        var handler = new JwtSecurityTokenHandler();
        var token = handler.CreateToken(tokenDescriptor);
        return handler.WriteToken(token);
    }

    public async Task<string> GenerateRefreshToken(Guid userId)
    {
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

        RefreshToken refreshToken = new()
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Value = token,
            ExpiresAt = DateTimeOffset.UtcNow.AddHours(_jwtSettings.RefreshTokenExpirationInHours),
        };
        var persisted = await PersistToken(refreshToken);
        if (!persisted)
        {
            _logger.LogError("Failed to persist refresh token for user {UserId}", userId);
            throw new InvalidOperationException("Failed to persist refresh token.");
        }

        return token;
    }

    public async Task<bool> RevokeToken(string refreshToken)
    {
        return await _repository.RevokeToken(refreshToken);
    }

    public async Task<bool> RevokeAllTokens(Guid userId)
    {
        return await _repository.RevokeAllTokens(userId);
    }

    private async Task<bool> PersistToken(RefreshToken refreshToken)
    {
        return await _repository.AddToken(refreshToken);
    }
}
