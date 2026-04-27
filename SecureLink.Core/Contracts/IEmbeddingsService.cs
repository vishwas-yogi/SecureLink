namespace SecureLink.Core.Contracts;

public interface IEmbeddingsService
{
    public Task<ServiceResult<ErrorDetails>> PersistEmbedding(PersistEmbeddingsRequest request);
    public Task<ServiceResult<SearchSimilarResponse, ErrorDetails>> Search(
        SearchImagesRequest request
    );
}
