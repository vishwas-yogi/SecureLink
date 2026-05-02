using Microsoft.AspNetCore.Mvc;
using SecureLink.Api.Helpers;
using SecureLink.Core.Contracts;
using SecureLink.Infrastructure.Contracts;

namespace SecureLink.Api.Controllers;

[ApiController]
public class EmbeddingsController(
    IEmbeddingsService embeddingsService,
    IFilesRepository filesRepository,
    ILogger<EmbeddingsController> logger
) : ControllerBase
{
    private readonly ILogger<EmbeddingsController> _logger = logger;
    private readonly IEmbeddingsService _embeddingsService = embeddingsService;
    private readonly IFilesRepository _filesRepository = filesRepository;

    [InternalApiKey]
    [HttpPost]
    [Route("files/{fileId}/embeddings")]
    public async Task<ActionResult> StoreEmbeddings(
        [FromRoute] Guid fileId,
        [FromBody] SubmitEmbeddingsApiRequest request
    )
    {
        _logger.LogInformation(
            "Embeddings received for file: {fileId}. Embeddings are: {faces}",
            fileId,
            request
        );

        if (!request.IsSuccess)
        {
            // TODO: update file processing status to retry once implemented.
            // For now just logging
            _logger.LogError(
                "The python service failed to generate embeddings for file: {fileId}",
                fileId
            );

            // Update processing status to Failed
            await _filesRepository.UpdateProcessingStatus(fileId, FileProcessingStatus.Failed);
            return BadRequest("Failed to generate embeddings");
        }

        var response = await _embeddingsService.PersistEmbedding(
            new PersistEmbeddingsRequest
            {
                FileId = fileId,
                Faces =
                [
                    .. request.Faces.Select(f => new Face
                    {
                        Embedding = f.Embedding,
                        FaceConfidence = f.FaceConfidence,
                    }),
                ],
            }
        );

        await _filesRepository.UpdateProcessingStatus(
            fileId,
            FileProcessingStatus.EmbeddingCompleted
        );

        _logger.LogInformation("Store embeddings response: {response}", response);

        return Ok("Embeddings received");
    }
}
