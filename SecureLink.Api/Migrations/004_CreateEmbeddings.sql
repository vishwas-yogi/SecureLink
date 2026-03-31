CREATE TABLE IF NOT EXISTS face_embeddings (
    row_id      int NOT NULL GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    file_id     UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    embedding   vector(512) NOT NULL,
    confidence  FLOAT NOT NULL,
    created_at  timestamp with time zone NOT NULL
);

CREATE INDEX ON face_embeddings 
USING hnsw (embedding vector_cosine_ops);