using SecureLink.Core.Contracts;

namespace SecureLink.Infrastructure.Contracts;

public interface IAuthValidator
{
    public ValidationResult<ErrorDetails> ValidatePassword(string password);
    public Task<ValidationResult<RefreshTokenErrorDetails>> ValidateRefreshToken(
        string token,
        Guid userId
    );
}
