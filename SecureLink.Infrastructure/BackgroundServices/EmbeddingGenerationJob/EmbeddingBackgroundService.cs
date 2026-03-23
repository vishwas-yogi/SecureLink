using System.Net.Http.Json;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SecureLink.Core.Contracts;

namespace SecureLink.Infrastructure.BackgroundServices.EmbeddingGenerationJob;

public class EmbeddingBackgroundService(
    IEmbeddingQueue queue,
    IHttpClientFactory factory,
    ILogger<EmbeddingBackgroundService> logger
) : BackgroundService
{
    private readonly IEmbeddingQueue _queue = queue;
    private readonly IHttpClientFactory _factory = factory;
    private readonly ILogger<EmbeddingBackgroundService> _logger = logger;
    private const int _maxRetries = 3;
    private const string _requestEmbeddingsEndpoint = "images";

    protected override async Task ExecuteAsync(CancellationToken token)
    {
        _logger.LogInformation("Embedding requesting background service is ready...");

        while (!token.IsCancellationRequested)
        {
            try
            {
                var job = await _queue.DequeueAsync(token);
                await RequestEmbeddings(job, token);
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Embedding background service terminating as requested");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Something went wrong while submitting embedding request");
            }
        }

        _logger.LogInformation("Thumbnail generation background service is terminating...");
    }

    private async Task RequestEmbeddings(EmbeddingJob job, CancellationToken token)
    {
        try
        {
            using var client = _factory.CreateClient("embedding");
            using var response = await client.PostAsJsonAsync(
                _requestEmbeddingsEndpoint,
                new { file_id = job.FileId, storage_key = job.ThumbnailKey },
                token
            );

            if (response.StatusCode != System.Net.HttpStatusCode.Accepted)
            {
                throw new Exception("Embedding request not accepted");
            }

            _logger.LogInformation("Request for embeddings submitted for job: {job}", job);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Couldn't queue the request for embedding for job: {job}", job);
            await HandleRetry(job, token);
        }
    }

    private async Task HandleRetry(EmbeddingJob job, CancellationToken token)
    {
        if (job.RetryCount >= _maxRetries)
        {
            _logger.LogWarning("Max retries exhausted for file: {fileId}", job.FileId);
            return;
        }

        var retryJob = job with { RetryCount = job.RetryCount + 1 };

        await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, retryJob.RetryCount)), token);
        await _queue.QueueAsync(retryJob, token);
    }
}
