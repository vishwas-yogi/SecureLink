using System.Net;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SecureLink.Core.Contracts;
using SecureLink.Infrastructure.Contracts;

namespace SecureLink.Infrastructure.Repositories;

public class R2StorageService(
    IAmazonS3 s3Client,
    IOptions<StorageOptions> options,
    ILogger<R2StorageService> logger
) : IStorageService
{
    private readonly IAmazonS3 _client = s3Client;
    private readonly StorageOptions _options =
        options.Value
        ?? throw new ArgumentNullException(nameof(options), "StorageOptions must be configured.");

    private readonly ILogger<R2StorageService> _logger = logger;

    public async Task<Stream> Download(string storageKey)
    {
        _logger.LogInformation("Starting download of the file from R2: {filename}", storageKey);

        try
        {
            var request = new GetObjectRequest { BucketName = _options.Bucket, Key = storageKey };

            var response = await _client.GetObjectAsync(request);

            _logger.LogInformation(
                "Returned network stream for file from R2: {filename}",
                storageKey
            );

            return response.ResponseStream;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            _logger.LogWarning("File not found in R2 bucket: {filename}", storageKey);

            throw new FileNotFoundException(
                $"The requested file '{storageKey}' does not exist in storage.",
                ex
            );
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning(
                "Download request for {filename} was aborted by the client.",
                storageKey
            );
            throw;
        }
        catch (AmazonS3Exception ex)
        {
            _logger.LogError(
                ex,
                "R2 API connection error while downloading file: {filename}",
                storageKey
            );
            throw;
        }
    }

    public Task<bool> FileExists(string storageKey)
    {
        // Returning true always as the Download endpoint in R2 directly takes care of checking if the file exists
        return Task.FromResult(true);
    }

    public async Task<string> Upload(Stream file, string storageKey)
    {
        try
        {
            _logger.LogInformation("Upload starting for key: {key}", storageKey);
            using var fileStream = new MemoryStream();
            await file.CopyToAsync(fileStream);
            fileStream.Position = 0;

            var request = new PutObjectRequest
            {
                BucketName = _options.Bucket,
                Key = storageKey,
                InputStream = fileStream,

                // For R2 compatibility
                DisablePayloadSigning = true,
                DisableDefaultChecksumValidation = true,
            };

            await _client.PutObjectAsync(request);
            _logger.LogInformation("Upload completed for key: {key}", storageKey);
            return storageKey;
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning(
                "Upload request for Key: {Key} was aborted by the client.",
                storageKey
            );
            throw;
        }
        catch (AmazonS3Exception ex)
        {
            _logger.LogError(
                ex,
                "R2 Upload failed for Key: {Key}. Status Code: {Status}. Error: {Msg}",
                storageKey,
                ex.StatusCode,
                ex.Message
            );
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Unexpected network error during R2 upload for Key: {Key}",
                storageKey
            );
            throw;
        }
    }
}
