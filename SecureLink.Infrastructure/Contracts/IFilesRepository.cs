using SecureLink.Core.Contracts;
using SecureLink.Core.Entities;

namespace SecureLink.Infrastructure.Contracts;

public interface IFilesRepository
{
    public Task<StoredFile?> Get(FileGetRepoRequest request);
    public Task<Guid> Persist(FilePersistRepoRequest request);
    public Task<bool> MarkFileAvailable(Guid fileId, string fileLocation);
    public Task<bool> UpdateMetadata(Guid fileId, string thumbKey);
    public Task<List<FileProcessingStatusDto>> GetBatchStatus(List<Guid> fileIds, Guid userId);
    public Task<bool> UpdateProcessingStatus(Guid fileId, FileProcessingStatus updatedStatus);
}
