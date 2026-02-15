namespace SecureLink.Infrastructure.Contracts;

public record CreateUserRepoRequest
{
    public required Guid Id { get; init; }
    public required string Username { get; init; } = string.Empty;
    public required string Name { get; init; } = string.Empty;
    public string? Email { get; init; }
    public required string PasswordHash { get; init; } = string.Empty;
}
