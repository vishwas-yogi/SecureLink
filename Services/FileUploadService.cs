using FileUploader.Interfaces;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Net.Http.Headers;

namespace FileUploader.Services;

public class FileUploadService(IFileUploadRepository repository, ILogger<FileUploadService> logger)
    : IFileUploadService
{
    private readonly ILogger<FileUploadService> _logger = logger;
    private readonly IFileUploadRepository _repository = repository;

    public async Task<string> UploadFile(string boundary, Stream uploadedFileStream)
    {
        string outputFileName = Guid.NewGuid().ToString();
        string outputFilePath = "";
        var reader = new MultipartReader(boundary, uploadedFileStream);
        MultipartSection? section;
        long totalBytesRead = 0;

        while ((section = await reader.ReadNextSectionAsync()) != null)
        {
            var contentDispositionHeader = section.GetContentDispositionHeader();

            if (contentDispositionHeader == null)
            {
                _logger.LogError("The request must contain the content disposition header");
                throw new InvalidOperationException(
                    "The request must contain the content disposition header"
                );
            }

            Stream content = section.Body;

            // If it is a file write it to output file stream
            if (contentDispositionHeader.IsFileDisposition())
            {
                var originalFileName = contentDispositionHeader.FileName.Value;
                var extension = Path.GetExtension(originalFileName);
                var finalOutputFileName = Path.ChangeExtension(outputFileName, extension);

                _logger.LogInformation($"Processing file: {originalFileName}");

                outputFilePath = await _repository.UploadFile(content, finalOutputFileName);
                totalBytesRead += content.Length;
            }
            // Else handle the metadata
            else if (contentDispositionHeader.IsFormDisposition())
            {
                // Converting content from Stream to string
                using var streamReader = new StreamReader(content);
                string value = await streamReader.ReadToEndAsync();
                string key = contentDispositionHeader.Name.Value ?? "";

                // Just logging for now
                _logger.LogInformation($"Metadata for file: {key} = {value}");
            }
        }

        _logger.LogInformation($"File upload completed. Total bytes read: {totalBytesRead} bytes");

        return outputFilePath;
    }
}
