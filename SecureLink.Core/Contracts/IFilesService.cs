namespace SecureLink.Core.Contracts;

public interface IFilesService
{
    public Task<ServiceResult<List<FileUploadResponse>, FileUploadErrorDetails>> Upload(
        string boundary,
        Stream inputStream,
        Guid currentUser,
        CancellationToken cancellationToken
    );
    public Task<ServiceResult<FileDownloadServiceResponse, FileDownloadErrorDetails>> Download(
        Guid fileId,
        Guid currentUserId,
        CancellationToken cancellationToken
    );
    public Task<ServiceResult<BatchStatusResponse, ErrorDetails>> GetBatchStatus(
        BatchFileStatusRequest request
    );
    public Task<ServiceResult<Stream, FileDownloadErrorDetails>> DownloadThumbnail(
        string thumbKey,
        CancellationToken cancellationToken
    );
}
