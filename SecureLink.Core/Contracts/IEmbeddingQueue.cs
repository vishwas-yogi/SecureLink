namespace SecureLink.Core.Contracts;

public interface IEmbeddingQueue
{
    ValueTask QueueAsync(EmbeddingJob job, CancellationToken token = default);
    ValueTask<EmbeddingJob> DequeueAsync(CancellationToken token = default);
}
