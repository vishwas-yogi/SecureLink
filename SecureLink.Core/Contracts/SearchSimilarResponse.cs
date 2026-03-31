namespace SecureLink.Core.Contracts;

public record SearchSimilarResponse
{
    public required List<Match> Matches { get; init; }
}

public record Match
{
    public required Guid FileId { get; init; }
    public required float MatchScore { get; init; }
}
