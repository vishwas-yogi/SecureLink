namespace SecureLink.Core.Contracts;

// Tracks the upload status of file
public enum FileStatus
{
    Available,
    Pending,
    CleanupRequired,
    Deleted, // For soft delete
}
