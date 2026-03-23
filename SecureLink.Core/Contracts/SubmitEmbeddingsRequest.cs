namespace SecureLink.Core.Contracts;

public record SubmitEmbeddingsRequest
{
    public required float[] Embedding { get; init; }
    public required float FaceConfidence { get; init; }
}
