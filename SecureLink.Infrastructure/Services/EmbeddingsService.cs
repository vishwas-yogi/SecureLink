using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using SecureLink.Core.Contracts;
using SecureLink.Infrastructure.Contracts;

namespace SecureLink.Infrastructure.Services;

public class EmbeddingsService(
    IEmbeddingsRepository repository,
    IHttpClientFactory factory,
    ILogger<EmbeddingsService> logger
) : IEmbeddingsService
{
    private readonly IEmbeddingsRepository _repo = repository;
    private readonly IHttpClientFactory _factory = factory;
    private readonly ILogger<EmbeddingsService> _logger = logger;
    private static readonly JsonSerializerOptions _options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true,
    };

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

    private async Task<ServiceResult<SearchSimilarResponse, ErrorDetails>> SearchSimilarImages(
        SearchSimilarRequest request
    )
    {
        try
        {
            _logger.LogInformation("Searching images for user: {userId}", request.UserId);

            var matches = await _repo.Search(request.Face);

            return ServiceResult<SearchSimilarResponse, ErrorDetails>.Success(
                new SearchSimilarResponse { Matches = matches }
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Something went wrong while trying to search images for user: {userId}",
                request.UserId
            );
            return ServiceResult<SearchSimilarResponse, ErrorDetails>.UnexpectedError(
                new ErrorDetails
                {
                    Message = "Something went wrong while trying to find the matches",
                }
            );
        }
    }

    public async Task<ServiceResult<SearchSimilarResponse, ErrorDetails>> Search(
        SearchImagesRequest request
    )
    {
        using var contentStream = new StreamContent(request.ImageStream);
        contentStream.Headers.ContentType = new MediaTypeHeaderValue(request.ContentType);

        using var client = _factory.CreateClient("embedding");
        var response = await client.PostAsync("/selfie-embedding", contentStream);
        if (!response.IsSuccessStatusCode)
        {
            return ServiceResult<SearchSimilarResponse, ErrorDetails>.UnexpectedError(
                new ErrorDetails
                {
                    Message =
                        "Invalid image. Failed to process the image. Kindly, try with another image",
                }
            );
        }

        var result = await response.Content.ReadFromJsonAsync<Face>(_options);
        if (result?.Embedding.Length == 0)
        {
            return ServiceResult<SearchSimilarResponse, ErrorDetails>.ValidationError(
                new ErrorDetails
                {
                    Message = "Invalid Image. No faces detected. Kindly, try with another image",
                }
            );
        }

        return await SearchSimilarImages(
            new SearchSimilarRequest { Face = result!, UserId = request.UserId }
        );
    }
}
