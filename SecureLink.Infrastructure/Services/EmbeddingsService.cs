using Microsoft.Extensions.Logging;
using SecureLink.Core.Contracts;
using SecureLink.Infrastructure.Contracts;

namespace SecureLink.Infrastructure.Services;

public class EmbeddingsService(IEmbeddingsRepository repository, ILogger<EmbeddingsService> logger)
    : IEmbeddingsService
{
    private readonly IEmbeddingsRepository _repo = repository;
    private readonly ILogger<EmbeddingsService> _logger = logger;

    public async Task<ServiceResult<ErrorDetails>> PersistEmbedding(
        PersistEmbeddingsRequest request
    )
    {
        try
        {
            _logger.LogInformation("Storing embeddings for file: {fileID}", request.FileId);

            var response = await _repo.Create(request);

            if (!response)
                return ServiceResult<ErrorDetails>.UnexpectedError(
                    new ErrorDetails
                    {
                        Message = "Something went wrong while trying to store the embeddings",
                    }
                );

            return ServiceResult<ErrorDetails>.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Something went wrong while trying to store the embeddings for file: {FileId}",
                request.FileId
            );
            return ServiceResult<ErrorDetails>.UnexpectedError(
                new ErrorDetails
                {
                    Message = "Something went wrong while trying to store the embeddings",
                }
            );
        }
    }

    public async Task<ServiceResult<SearchSimilarResponse, ErrorDetails>> SearchSimilarImages(
        SearchSimilarRequest request
    )
    {
        try
        {
            _logger.LogInformation("Searching images for user"); // TODO: add user id

            var matches = await _repo.Search(request.Face);

            return ServiceResult<SearchSimilarResponse, ErrorDetails>.Success(
                new SearchSimilarResponse { Matches = matches }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Something went wrong while trying to search images for user"); // TODO: add user id
            return ServiceResult<SearchSimilarResponse, ErrorDetails>.UnexpectedError(
                new ErrorDetails { Message = "Something went wrong while trying find the matches" }
            );
        }
    }
}
