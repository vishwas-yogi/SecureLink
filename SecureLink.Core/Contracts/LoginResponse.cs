namespace SecureLink.Core.Contracts;

public record LoginResponse
{
    public required string AccessToken { get; init; }
    public required string RefreshToken { get; init; }
    public required long ExpiresAt { get; init; }
    public required Guid UserId { get; init; }
    public required string Username { get; init; }
}
