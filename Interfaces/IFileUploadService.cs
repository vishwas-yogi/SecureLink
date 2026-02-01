namespace FileUploader.Interfaces;

public interface IFileUploadService
{
    public Task<string> UploadFile(string boundary, Stream inputStream);
}
