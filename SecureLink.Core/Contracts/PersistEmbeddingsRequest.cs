namespace SecureLink.Core.Contracts;

public record PersistEmbeddingsRequest
{
    public required Guid FileId { get; init; }
    public required List<Face> Faces { get; init; }
}
