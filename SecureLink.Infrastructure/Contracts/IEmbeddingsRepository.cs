using SecureLink.Core.Contracts;

namespace SecureLink.Infrastructure.Contracts;

public interface IEmbeddingsRepository
{
    Task<bool> Create(PersistEmbeddingsRequest request);
    Task<List<Match>> Search(Face face);
}
