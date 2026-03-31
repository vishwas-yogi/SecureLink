using Dapper;
using SecureLink.Core.Contracts;
using SecureLink.Infrastructure.Contracts;

namespace SecureLink.Infrastructure.Repositories;

public class EmbeddingsRepository(IDapperContext dapperContext)
    : RepositoryBase(dapperContext),
        IEmbeddingsRepository
{
    public async Task<bool> Create(PersistEmbeddingsRequest request)
    {
        var fileId = request.FileId;

        var sql = """
                insert into face_embeddings
                (
                    file_id,
                    embedding,
                    confidence,
                    created_at
                )
                values
                (
                    @FileId,
                    @Embedding,
                    @Confidence,
                    CURRENT_TIMESTAMP
                )
            """;

        var rows = request.Faces.Select(f => new
        {
            FileId = fileId,
            f.Embedding,
            Confidence = f.FaceConfidence,
        });

        using var connection = DbContext.CreateConnection();
        var affectedRows = await connection.ExecuteAsync(sql, rows);
        return affectedRows > 0;
    }

    public async Task<List<Match>> Search(Face face)
    {
        var sql = $"""
                    with best_matches as (
                        select distinct on (file_id)
                            file_id,
                            1 - (embedding <=> @InputVector::vector) as best_match_score
                        from face_embeddings
                        order by file_id, embedding <=> @InputVector::vector
                    )
                    select file_id, best_match_score
                    from best_matches
                    where best_match_score > @Threshold
                    order by best_match_score desc;
            """;

        var variables = new { InputVector = face.Embedding, Threshold = 0.6 };

        using var connection = DbContext.CreateConnection();
        var matches = await connection.QueryAsync<Match>(sql, variables);
        return matches.AsList();
    }
}
