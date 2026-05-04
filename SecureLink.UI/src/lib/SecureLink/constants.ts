export const FileProcessingStatuses = [
  "Uknown",
  "ThumbnailQueued",
  "ThumbnailCompleted",
  "EmbeddingQueued",
  "EmbeddingCompleted",
  "Failed",
] as const;

export const FileStatuses = [
  "Available",
  "Pending",
  "CleanupRequired",
  "Deleted",
] as const;

export const Local_Storage_Keys = {
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
    userId: 'userId',
    username: 'username',
}