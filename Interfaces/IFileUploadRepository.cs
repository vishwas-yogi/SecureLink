namespace FileUploader.Interfaces;

public interface IFileUploadRepository
{
    public Task<string> UploadFile(Stream file, string fileName);
}
