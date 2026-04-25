namespace SecureLink.Core.Contracts;

public record SearchSimilarRequest
{
    public required Face Face { get; init; }
    public required Guid UserId { get; init; }
}
