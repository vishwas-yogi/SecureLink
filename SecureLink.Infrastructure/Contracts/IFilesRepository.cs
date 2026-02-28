using SecureLink.Core.Entities;

namespace SecureLink.Infrastructure.Contracts;

public interface IFilesRepository
{
    public Task<StoredFile?> Get(FileGetRepoRequest request);
    public Task<Guid> Persist(FilePersistRepoRequest request);
    public Task<bool> MarkFileAvailable(Guid fileId, string fileLocation);
}
