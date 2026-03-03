namespace SecureLink.Core.Contracts;

public interface IThumbnailService
{
    public Task<Stream> CreateThumbnail(Stream input);
}
