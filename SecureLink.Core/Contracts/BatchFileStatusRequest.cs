namespace SecureLink.Core.Contracts;

public record BatchFileStatusApiRequest
{
    public required List<Guid> FileIds { get; set; }
}

public record BatchFileStatusRequest
{
    public required List<Guid> FileIds { get; init; }
    public required Guid UserId { get; init; }
}
