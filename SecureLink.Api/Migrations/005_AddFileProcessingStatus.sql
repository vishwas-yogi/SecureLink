DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'file_processing_status') THEN
        CREATE TYPE file_processing_status AS ENUM ('Unknown',  'ThumbnailQueued',  'ThumbnailCompleted', 'EmbeddingQueued',  'EmbeddingCompleted', 'Failed');
    END IF;
END
$$;

ALTER TABLE files
ADD COLUMN IF NOT EXISTS processing_status file_processing_status NOT NULL DEFAULT 'Unknown';