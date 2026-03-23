using System.Threading.Channels;
using SecureLink.Core.Contracts;

namespace SecureLink.Infrastructure.BackgroundServices.EmbeddingGenerationJob;

public class EmbeddingQueue : IEmbeddingQueue
{
    private const int _capacity = 50;
    private readonly Channel<EmbeddingJob> _channel;

    public EmbeddingQueue()
    {
        _channel = Channel.CreateBounded<EmbeddingJob>(
            new BoundedChannelOptions(_capacity) { FullMode = BoundedChannelFullMode.Wait }
        );
    }

    public async ValueTask<EmbeddingJob> DequeueAsync(CancellationToken token)
    {
        return await _channel.Reader.ReadAsync(token);
    }

    public async ValueTask QueueAsync(EmbeddingJob job, CancellationToken token)
    {
        await _channel.Writer.WriteAsync(job, token);
    }
}
