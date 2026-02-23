namespace SecureLink.Core.Contracts;

public class RefreshTokenErrorDetails
{
    public bool IsRevoked { get; set; } = false;
    public bool IsExpired { get; set; } = false;
    public bool IsUserMismatch { get; set; } = false;
    public string? Message { get; set; }
}
