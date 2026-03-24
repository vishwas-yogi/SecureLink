namespace SecureLink.Core.Contracts;

public record EmbeddingJob
{
    public required Guid FileId { get; init; }
    public required string ThumbnailKey { get; init; }
    public int RetryCount { get; init; } = 0;
}
