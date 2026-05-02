namespace SecureLink.Core.Contracts;

// Tracks the processing state of the file
public enum FileProcessingStatus
{
    Unknown = 0,

    ThumbnailQueued = 10,
    ThumbnailCompleted = 11,

    EmbeddingQueued = 20,
    EmbeddingCompleted = 21,

    Failed = 90,
}
