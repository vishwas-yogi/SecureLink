using Dapper;
using Microsoft.Extensions.Logging;
using SecureLink.Core.Contracts;
using SecureLink.Core.Entities;
using SecureLink.Infrastructure.Contracts;

namespace SecureLink.Infrastructure.Repositories;

public class FilesRepository(ILogger<FilesRepository> logger, IDapperContext dapperContext)
    : RepositoryBase(dapperContext),
        IFilesRepository
{
    private readonly ILogger<FilesRepository> _logger = logger;
    private readonly string _selectColumns =
        "id, filename, user_filename, content_type, metadata, location, owner, status, created_at, last_modified_at";

    public async Task<StoredFile?> Get(FileGetRepoRequest request)
    {
        _logger.LogInformation("File get initiating for file: {fileId}", request.Id);

        var sql = $"""
            select {_selectColumns}
            from files
            where id = @Id and owner = @Owner;
            """;

        var variables = new { request.Id, request.Owner };

        using var connection = DbContext.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<StoredFile?>(sql, variables);
    }

    public async Task<Guid> Persist(FilePersistRepoRequest request)
    {
        _logger.LogInformation("File upload initiating for: {filename}", request.Filename);

        var sql = """
                    insert into files
                    (
                        id,
                        filename,
                        user_filename,
                        content_type,
                        owner,
                        status,
                        created_at,
                        last_modified_at
                    )
                    values
                    (
                        @Id,
                        @Filename,
                        @UserFileName,
                        @ContentType,
                        @Owner,
                        @Status::file_status,
                        CURRENT_TIMESTAMP,
                        CURRENT_TIMESTAMP
                    )
                    returning id;
            """;

        var variables = new
        {
            Id = Guid.NewGuid(),
            request.Filename,
            request.UserFilename,
            request.ContentType,
            request.Owner,
            Status = FileStatus.Pending.ToString(),
        };

        using var connection = DbContext.CreateConnection();
        return await connection.QuerySingleAsync<Guid>(sql, variables);
    }

    public async Task<bool> MarkFileAvailable(Guid fileId, string fileLocation)
    {
        var sql = """
                update files
                set
                    location = @Location,
                    status = @Status::file_status,
                    last_modified_at = CURRENT_TIMESTAMP
                where id = @Id;
            """;

        var variables = new
        {
            Location = fileLocation,
            Id = fileId,
            Status = FileStatus.Available.ToString(),
        };

        using var connection = DbContext.CreateConnection();
        var affected = await connection.ExecuteAsync(sql, variables);
        return affected > 0;
    }

    public async Task<bool> UpdateMetadata(Guid fileId, string thumbKey)
    {
        var sql = """
                update files
                set
                    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('thumbkey', @ThumbKey)
                where id = @Id;
            """;

        var variables = new { ThumbKey = thumbKey, Id = fileId };

        using var connection = DbContext.CreateConnection();
        var affected = await connection.ExecuteAsync(sql, variables);
        return affected > 0;
    }

    public async Task<List<FileProcessingStatusDto>> GetBatchStatus(List<Guid> fileIds, Guid userId)
    {
        _logger.LogInformation(
            "GetBatchStatus repo request initiated for: {fileIds} for user: {user}",
            fileIds,
            userId
        );

        var sql = """
                select 
                    id as FileId,
                    processing_status as ProcessingStatus,
                    status as Status 
                from files
                where id = ANY(@FileIds)
                and owner = @UserId
            """;

        var variables = new { FileIds = fileIds.ToArray(), UserId = userId };

        using var connection = DbContext.CreateConnection();
        var result = await connection.QueryAsync<FileProcessingStatusDto>(sql, variables);

        return result.AsList();
    }

    public async Task<bool> UpdateProcessingStatus(Guid fileId, FileProcessingStatus updatedStatus)
    {
        _logger.LogInformation(
            "UpdateFileProcessingStatus initiated for file: {fileId} with updated status: {updatedStatus}",
            fileId,
            updatedStatus
        );

        var sql = $"""
                update files
                set processing_status = @UpdatedStatus::file_processing_status
                where id = @FileId;
            """;

        var variables = new { FileId = fileId, UpdatedStatus = updatedStatus.ToString() };

        using var connection = DbContext.CreateConnection();
        var affected = await connection.ExecuteAsync(sql, variables);
        return affected > 0;
    }
}
