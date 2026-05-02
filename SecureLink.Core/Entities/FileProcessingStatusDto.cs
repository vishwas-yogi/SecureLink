using SecureLink.Core.Contracts;

namespace SecureLink.Core.Entities;

public record FileProcessingStatusDto
{
    public required Guid FileId { get; set; }
    public required FileProcessingStatus ProcessingStatus { get; set; }
    public required FileStatus Status { get; set; }
}
