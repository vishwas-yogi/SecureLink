namespace SecureLink.Core.Contracts;

public interface IStorageService
{
    public Task<string> Upload(Stream file, string storageKey, CancellationToken cancellationToken);
    public Task<Stream> Download(string storageKey, CancellationToken cancellationToken);
    public Task<bool> FileExists(string storageKey);
}
