namespace SecureLink.Core.Contracts;

public interface IStorageService
{
    public Task<string> Upload(Stream file, string filename);
    public Task<Stream> Download(string filename);
    public Task<bool> FileExists(string filename);
}
