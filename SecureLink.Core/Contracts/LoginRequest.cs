namespace SecureLink.Core.Contracts;

public record LoginRequest
{
    public required string Username { get; init; }
    public required string Password { get; init; }

    public override string ToString()
    {
        return $"LoginRequest {{ Username = {Username}, Password = *** }}";
    }
}
