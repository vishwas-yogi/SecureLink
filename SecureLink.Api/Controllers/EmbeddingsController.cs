using Microsoft.AspNetCore.Mvc;
using SecureLink.Api.Helpers;
using SecureLink.Core.Contracts;

namespace SecureLink.Api.Controllers;

[ApiController]
public class EmbeddingsController(ILogger<EmbeddingsController> logger) : ControllerBase
{
    private readonly ILogger<EmbeddingsController> _logger = logger;

    [InternalApiKey]
    [HttpPost]
    [Route("files/{fileId}/embeddings")]
    public async Task<ActionResult> StoreEmbeddings(
        [FromRoute] Guid fileId,
        [FromBody] SubmitEmbeddingsRequest request
    )
    {
        _logger.LogInformation(
            "Embeddings received for file: {fileId}. Embeddings are: {faces}",
            fileId,
            request
        );

        // TODO: persist embeddings to DB

        return Ok("Embeddings received");
    }
}
