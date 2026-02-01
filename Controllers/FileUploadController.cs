using FileUploader.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Net.Http.Headers;

namespace FileUploader.Controllers;

[ApiController]
[Route("file")]
public class FileUploadController(
    IFileUploadService fileService,
    ILogger<FileUploadController> logger
) : ControllerBase
{
    private readonly ILogger<FileUploadController> _logger = logger;
    private readonly IFileUploadService _fileService = fileService;

    [HttpPost]
    [Route("")]
    public async Task<ActionResult<string>> UploadFile()
    {
        _logger.LogInformation($"Controller UploadFile invoked with Request: {Request}");

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
        var outputFilePath = await _fileService.UploadFile(boundary, Request.Body);
        return Ok("File is located at: " + outputFilePath);
    }
}
