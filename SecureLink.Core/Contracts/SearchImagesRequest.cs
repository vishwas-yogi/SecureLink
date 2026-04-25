namespace SecureLink.Core.Contracts;

public record SearchImagesRequest
{
    public required Stream ImageStream { get; init; }
    public required string ContentType { get; init; }
    public required Guid UserId { get; init; }
}
