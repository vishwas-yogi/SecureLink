using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Net.Http.Headers;
using SecureLink.Core.Contracts;

namespace SecureLink.Api.Controllers;

[Authorize]
// TODO: Add a cancellation token
[ApiController]
[Route("files")]
public class FilesController(
    IFilesService fileService,
    IEmbeddingsService embeddingsService,
    ILogger<FilesController> logger
) : ControllerBase
{
    private readonly ILogger<FilesController> _logger = logger;
    private readonly IFilesService _fileService = fileService;
    private readonly IEmbeddingsService _embeddingService = embeddingsService;

    [HttpPost]
    [Route("")]
    public async Task<ActionResult<List<FileUploadResponse>>> Upload()
    {
        var currentUser = User.GetUserId();
        if (currentUser is null)
        {
            return Unauthorized("Unable to resolve the logged in user");
        }

        _logger.LogInformation("Controller UploadFile invoked with Request: {Request}", Request);

        if (!Request.ContentType?.StartsWith("multipart/form-data") ?? true)
        {
            return BadRequest("The request is invalid, as it is not a multi part request");
        }

        var boundary = HeaderUtilities
            .RemoveQuotes(MediaTypeHeaderValue.Parse(Request.ContentType).Boundary)
            .Value;

        if (string.IsNullOrWhiteSpace(boundary))
        {
            return BadRequest("Boundary can't be null");
        }
        var response = await _fileService.Upload(boundary, Request.Body, currentUser.Value);

        if (!response.IsSuccess)
        {
            return response.Status switch
            {
                ResponseStatus.ValidationError => StatusCode(400, response.Error),
                _ => StatusCode(500, "An unexpected error occurred"),
            };
        }

        return Ok(response.Data);
    }

    [HttpGet]
    [Route("{fileId}")]
    public async Task<ActionResult> Download([FromRoute] Guid fileId)
    {
        var currentUser = User.GetUserId();
        if (currentUser is null)
        {
            return Unauthorized("Unable to resolve the logged in user");
        }

        _logger.LogInformation("Controller DownloadFile invoked with Request: {Request}", Request);

        var response = await _fileService.Download(fileId, currentUser.Value);

        if (!response.IsSuccess)
        {
            return response.Status switch
            {
                ResponseStatus.ValidationError => StatusCode(400, response.Error),
                ResponseStatus.NotFound => StatusCode(404, response.Error),
                _ => StatusCode(500, "An unexpected error occurred"),
            };
        }

        var fileStream = response.Data!.FileStream;
        var fileDetails = response.Data.FileDetails;
        var safeDetails = new
        {
            fileDetails.Id,
            Filename = fileDetails.UserFilename,
            fileDetails.ContentType,
            fileDetails.CreatedAt,
            fileDetails.LastModifiedAt,
            fileDetails.Status,
        };
        Response.Headers.Append("X-File-Metadata", JsonSerializer.Serialize(safeDetails));

        var contentType = fileDetails!.ContentType;

        // File() already sets the Status code to 200. So no need to wrap it in Ok()
        return File(fileStream!, contentType, fileDetails.UserFilename, true);
    }

    [HttpPost]
    [Route("search")]
    public async Task<ActionResult> Search(IFormFile selfie)
    {
        var currentUser = User.GetUserId();
        if (currentUser is null)
        {
            return Unauthorized("Unable to resolve the logged in user");
        }

        if (selfie is null || selfie.Length == 0)
        {
            return BadRequest("A selfie image is required");
        }
        using var stream = selfie.OpenReadStream();

        var response = await _embeddingService.Search(
            new SearchImagesRequest
            {
                ImageStream = stream,
                ContentType = selfie.ContentType,
                UserId = currentUser.Value,
            }
        );

        if (!response.IsSuccess)
        {
            return response.Status switch
            {
                ResponseStatus.ValidationError => StatusCode(400, response.Error),
                _ => StatusCode(500, response.Error),
            };
        }

        return Ok(response.Data);
    }

    [HttpPost]
    [Route("status/batch")]
    public async Task<IActionResult> GetBatchStatus([FromBody] BatchFileStatusApiRequest request)
    {
        var currentUser = User.GetUserId();
        if (currentUser is null)
        {
            return Unauthorized("Unable to resolve the logged in user");
        }

        var response = await _fileService.GetBatchStatus(
            new BatchFileStatusRequest { FileIds = request.FileIds, UserId = currentUser.Value }
        );

        if (!response.IsSuccess)
        {
            return response.Status switch
            {
                ResponseStatus.BadRequest => StatusCode(400, response.Error),
                ResponseStatus.ValidationError => StatusCode(422, response.Error),
                _ => StatusCode(500, response.Error),
            };
        }

        return Ok(response.Data);
    }
}
