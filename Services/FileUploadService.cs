using FileUploader.Interfaces;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Net.Http.Headers;

namespace FileUploader.Services;

public class FileUploadService(ILogger<FileUploadService> logger) : IFileUploadService
{
    private readonly string outputFileName = Guid.NewGuid().ToString();
    private readonly ILogger<FileUploadService> _logger = logger;

    public async Task<string> UploadFile(string boundary, Stream uploadedFileStream)
    {
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

                _logger.LogInformation($"Processing file: {originalFileName}");

                // Construct file path and delete the file if it already exists
                var finalOutputFileName = Path.ChangeExtension(outputFileName, extension);
                outputFilePath = Path.Combine(GetOutputDir(), finalOutputFileName);
                RemoveFileIfExists(outputFilePath);

                // Constuct FileStream for the output file
                var options = new FileStreamOptions
                {
                    Mode = FileMode.Create,
                    Access = FileAccess.Write,
                    Options = FileOptions.Asynchronous,
                    Share = FileShare.None,
                };

                using FileStream outputStream = new(outputFilePath, options);

                await content.CopyToAsync(outputStream);
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

    private void RemoveFileIfExists(string filePath)
    {
        if (File.Exists(filePath))
        {
            File.Delete(filePath);
            _logger.LogInformation($"Deleted file: {filePath}");
        }
    }

    private static string GetOutputDir()
    {
        string outDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        if (!Directory.Exists(outDir))
        {
            Directory.CreateDirectory(outDir);
        }
        return outDir;
    }
}
