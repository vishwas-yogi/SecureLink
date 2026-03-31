using System.Text.Json.Serialization;

namespace SecureLink.Core.Contracts;

public record SubmitEmbeddingsApiRequest
{
    [JsonPropertyName("faces")]
    public required FaceDetails[] Faces { get; init; }

    [JsonPropertyName("is_success")]
    public required bool IsSuccess { get; init; }

    public override string ToString()
    {
        return $"SubmitEmbeddingRequest {{ IsSuccess = {IsSuccess}, FaceCount = {Faces.Length}, Faces = [{string.Join(", ", (IEnumerable<FaceDetails>)Faces)}] }}";
    }
}

public record FaceDetails
{
    [JsonPropertyName("embedding")]
    public required float[] Embedding { get; init; }

    [JsonPropertyName("face_confidence")]
    public required float FaceConfidence { get; init; }

    public override string ToString()
    {
        return $"FaceDetails {{ FaceConfidence: {FaceConfidence} }}";
    }
}
