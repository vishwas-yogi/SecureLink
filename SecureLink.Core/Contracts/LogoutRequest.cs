namespace SecureLink.Core.Contracts;

public record LogoutRequest
{
    public required Guid UserId { get; init; }
    public required string RefreshToken { get; init; }
}
