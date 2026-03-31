namespace SecureLink.Core.Contracts;

public record SearchSimilarRequest
{
    public required Face Face { get; init; }
}
