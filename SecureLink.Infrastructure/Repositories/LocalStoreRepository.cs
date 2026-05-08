using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SecureLink.Core.Contracts;
using SecureLink.Infrastructure.Contracts;

namespace SecureLink.Infrastructure.Repositories;

public class LocalStoreRepository(
    IOptions<StorageOptions> options,
    ILogger<LocalStoreRepository> logger
) : IStorageService
{
    private readonly ILogger<LocalStoreRepository> _logger = logger;
    private readonly StorageOptions _options =
        options.Value
        ?? throw new ArgumentNullException(
            nameof(options.Value.UploadDirectory),
            "StorageOptions UploadDirectory must be configured."
        );

    public async Task<string> Upload(
        Stream file,
        string storageKey,
        CancellationToken cancellationToken
    )
    {
        var outputFilePath = GetFullFilePath(storageKey);
        await RemoveFileIfExists(outputFilePath);

        // Constuct FileStream for the output file
        var options = new FileStreamOptions
        {
            Mode = FileMode.Create,
            Access = FileAccess.Write,
            Options = FileOptions.Asynchronous,
            Share = FileShare.None,
        };

        using FileStream outputStream = new(outputFilePath, options);

        await file.CopyToAsync(outputStream, cancellationToken);
        return outputFilePath;
    }

    public Task<Stream> Download(string storageKey, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Starting download of the file: {filename}", storageKey);
        var filePath = GetFullFilePath(storageKey);

        var options = new FileStreamOptions
        {
            Mode = FileMode.Open,
            Access = FileAccess.Read,
            Options = FileOptions.Asynchronous,
            Share = FileShare.Read, // So that mutiple downloads can happen parallely
        };

        var downloadStream = new FileStream(filePath, options);
        _logger.LogInformation("Returned file stream for file: {filename}", storageKey);
        return Task.FromResult<Stream>(downloadStream);
    }

    public async Task<bool> FileExists(string storageKey)
    {
        var filePath = GetFullFilePath(storageKey);
        if (await FileExistsInternal(filePath))
            return true;

        return false;
    }

    private Task<bool> FileExistsInternal(string filename)
    {
        if (File.Exists(filename))
            return Task.FromResult(true);

        return Task.FromResult(false);
    }

    private async Task RemoveFileIfExists(string filePath)
    {
        if (await FileExistsInternal(filePath))
        {
            File.Delete(filePath);
            _logger.LogInformation("Deleted file: {filePath}", filePath);
        }
    }

    private string GetOutputDir()
    {
        string outDir = Path.Combine(_options.UploadDirectory ?? "", "uploads");
        if (!Directory.Exists(outDir))
        {
            Directory.CreateDirectory(outDir);
        }
        return outDir;
    }

    private string GetFullFilePath(string filename)
    {
        return Path.Combine(GetOutputDir(), filename);
    }
}
