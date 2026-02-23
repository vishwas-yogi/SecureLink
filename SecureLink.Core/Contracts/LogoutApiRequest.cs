namespace SecureLink.Core.Contracts;

public record LogoutApiRequest
{
    public required string RefreshToken { get; init; }
}
