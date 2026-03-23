namespace SecureLink.Core.Contracts;

// Tracks the processing state of the file
public enum FileProcessingStatus
{
    Unknown = 0,

    Uploaded = 1,

    ThumbnailQueued = 10,
    ThumbnailProcessing = 11,
    ThumbnailCompleted = 12,

    EmbeddingQueued = 20,
    EmbeddingProcessing = 21,
    EmbeddingCompleted = 22,

    Failed = 90,
}
