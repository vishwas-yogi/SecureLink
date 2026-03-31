namespace SecureLink.Core.Contracts;

public record Face
{
    public required float[] Embedding { get; init; }
    public required float FaceConfidence { get; init; }
}
