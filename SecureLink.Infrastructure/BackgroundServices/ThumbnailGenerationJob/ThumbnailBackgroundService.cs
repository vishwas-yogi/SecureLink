using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SecureLink.Core.Contracts;
using SecureLink.Infrastructure.Contracts;

namespace SecureLink.Infrastructure.BackgroundServices.ThumbnailGenerationJob;

public class ThumbnailBackgroundService(
    IThumbnailQueue queue,
    IEmbeddingQueue embeddingQueue,
    IServiceScopeFactory scopeFactory,
    ILogger<ThumbnailBackgroundService> logger
) : BackgroundService
{
    private readonly IThumbnailQueue _queue = queue;
    private readonly IEmbeddingQueue _embeddingQueue = embeddingQueue;
    private readonly IServiceScopeFactory _scopeFactory = scopeFactory;
    private readonly ILogger<ThumbnailBackgroundService> _logger = logger;
    private const int _maxRetries = 3;

    protected override async Task ExecuteAsync(CancellationToken token)
    {
        _logger.LogInformation("Thumbnail generation background service is ready...");

        while (!token.IsCancellationRequested)
        {
            try
            {
                var job = await _queue.DequeueAsync(token);
                await ProcessThumbnail(job, token);
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Thumbnail processing terminating as requested");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Something went wrong while processing thumbnail in queue");
            }
        }

        _logger.LogInformation("Thumbnail generation background service is terminating...");
    }

    private async Task ProcessThumbnail(ThumbnailJob job, CancellationToken token)
    {
        using var scope = _scopeFactory.CreateScope();
        var storageService = scope.ServiceProvider.GetRequiredService<IStorageService>();
        var thumbnailService = scope.ServiceProvider.GetRequiredService<IThumbnailService>();
        var filesRepository = scope.ServiceProvider.GetRequiredService<IFilesRepository>();

        try
        {
            _logger.LogInformation("Processing thumbnail for file: {fileId}", job.FileId);
            using var originalFile = await storageService.Download(job.StorageKey);
            using var thumbStream = await thumbnailService.CreateThumbnail(originalFile);

            var thumbFilename = $"{Path.GetFileNameWithoutExtension(job.Filename)}_thumbnail";
            var thumbKey = $"{Guid.NewGuid()}.webp";
            await storageService.Upload(thumbStream, thumbKey);

            // Update the thumbKey to db
            await filesRepository.UpdateMetadata(job.FileId, thumbKey);
            // Update file processing status to ThumbnailCompleted
            await filesRepository.UpdateProcessingStatus(
                job.FileId,
                FileProcessingStatus.ThumbnailCompleted
            );

            // Add the thumbnail for embedding
            _logger.LogInformation(
                "Adding thumbnail to the embedding job queue for file: {fileId}",
                job.FileId
            );
            await AddEmbeddingJob(
                new EmbeddingJob { FileId = job.FileId, ThumbnailKey = thumbKey },
                token
            );

            // Update file processing status to EmbeddingQueued
            await filesRepository.UpdateProcessingStatus(
                job.FileId,
                FileProcessingStatus.EmbeddingQueued
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Processing failed for file: {fileId}", job.FileId);
            await HandleRetry(job, filesRepository, token);
        }
    }

    private async Task AddEmbeddingJob(EmbeddingJob job, CancellationToken token)
    {
        try
        {
            await _embeddingQueue.QueueAsync(job, token);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to enqueue embedding job for fileId: {fileId}",
                job.FileId
            );
        }
    }

    private async Task HandleRetry(
        ThumbnailJob job,
        IFilesRepository filesRepository,
        CancellationToken token
    )
    {
        if (job.RetryCount >= _maxRetries)
        {
            _logger.LogWarning("Max retries exhausted for file: {fileId}", job.FileId);

            // Update processing status to Failed after all the tries have been exhausted
            await filesRepository.UpdateProcessingStatus(job.FileId, FileProcessingStatus.Failed);
            return;
        }

        var retryJob = job with { RetryCount = job.RetryCount + 1 };

        await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, retryJob.RetryCount)), token);
        await _queue.QueueAsync(retryJob, token);
    }
}
