namespace SecureLink.Core.Contracts;

public record FileProcessingStatusResponse
{
    public required Guid FileId { get; init; }
    public required FileProcessingStatus ProcessingStatus { get; init; }
    public required FileStatus Status { get; init; }
}

public record BatchStatusResponse
{
    public required List<FileProcessingStatusResponse> Statuses { get; init; }
}
