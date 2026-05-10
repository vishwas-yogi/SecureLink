# Architecture Decision Records

Engineering decisions made during the development of SecureLink, with context and tradeoffs.

---

## 1. In-memory Channel over RabbitMQ for background job queues

**Context:** Thumbnail generation and embedding dispatch need to happen asynchronously after file upload. Needed a queue mechanism to decouple the upload response from the processing pipeline.

**Options considered:**

- RabbitMQ — persistent, distributed, survives process restarts
- Redis Streams — persistent, lightweight, good .NET support
- .NET `Channel<T>` — in-process, no infrastructure dependency

**Decision:** `Channel<T>` for now.

**Reasoning:** Zero traffic personal project with free-tier deployment constraints. Adding RabbitMQ means another Docker container, another service to monitor, and complicates free deployment. The `Channel<T>` approach is sufficient for the current scale.

**Tradeoff accepted:** Jobs in the queue are lost if the process crashes mid-flight. Mitigated by the cleanup worker which re-enqueues files stuck in intermediate states on a schedule.

**Future path:** Replace with Redis Streams or a Postgres-backed queue if the project needs to survive process restarts or scale horizontally.

---

## 2. Callback pattern for Python → .NET communication

**Context:** The .NET embedding worker calls the Python worker to generate face embeddings. Python processing takes several seconds — blocking the .NET worker thread while waiting was not acceptable.

**Options considered:**

- Synchronous HTTP — .NET calls Python, waits for response with embeddings
- Fire-and-forget with callback — .NET calls Python (gets 202), Python calls back when done
- Shared queue — Python reads from and writes to a shared queue

**Decision:** Async HTTP with callback pattern.

**Flow:**

```
.NET embedding worker → POST /embeddings/process → Python (202 Accepted)
                                                         ↓ (async)
.NET API ← POST /files/{fileId}/embeddings ← Python (when done)
```

**Reasoning:** Frees the .NET worker immediately. Python processes independently. .NET cleanup worker handles cases where Python crashes before calling back — file stays in `EmbeddingQueued` state and gets re-dispatched after a timeout threshold.

**Tradeoff accepted:** More complex than a synchronous call. Requires a callback endpoint on the .NET side and a shared secret for internal auth between services.

---

## 3. Facenet512 over ArcFace for face embeddings

**Context:** DeepFace supports multiple models. Needed to choose one for generating 512-dimensional face embeddings.

**Options considered:**

- Facenet512 — widely used, good accuracy, 512-dim embeddings
- ArcFace — higher theoretical accuracy, designed to maximize angular margin between identities

**Decision:** Facenet512.

**Reasoning:** Empirically tested both on the actual dataset. ArcFace cosine similarity scores clustered around 0.28 for genuine matches, making threshold tuning difficult. Facenet512 produced better separability — genuine matches scored ~0.47 while false positives were more clearly separated, allowing a workable threshold of 0.45.

**Tradeoff accepted:** Facenet512 may perform worse than ArcFace in ideal conditions. The decision was data-driven on the actual use case rather than benchmark-driven.

---

## 4. pgvector over a dedicated vector database

**Context:** Face embeddings need to be stored and searched using approximate nearest neighbour (ANN) similarity search.

**Options considered:**

- Pinecone — managed vector DB, generous free tier
- Weaviate — open source, self-hostable
- Qdrant — lightweight, good performance
- pgvector — Postgres extension, runs alongside existing DB

**Decision:** pgvector with HNSW index.

**Reasoning:** Postgres is already present for all other data. Adding pgvector means no additional infrastructure, no additional service to manage, and no context switching between two different databases. The HNSW index provides efficient ANN search well within the performance requirements for this scale.

**Tradeoff accepted:** pgvector is not as performant as dedicated vector databases at very large scale. For millions of embeddings, a dedicated solution would be warranted. For this project, pgvector is more than sufficient.

---

## 5. Dapper over Entity Framework Core

**Context:** Needed an ORM or data access layer for .NET.

**Options considered:**

- Entity Framework Core — full ORM, migrations, LINQ queries
- Dapper — lightweight micro-ORM, raw SQL

**Decision:** Dapper with raw SQL.

**Reasoning:** Familarity with dapper. pgvector queries use Postgres-specific operators (`<=>`, `<->`, `ANY()`, `DISTINCT ON`) that EF Core cannot express natively without raw SQL fallbacks anyway. Writing raw SQL with Dapper gives full control over query shape, indexing hints, and CTEs. Avoids the abstraction overhead of EF Core for a project where most interesting queries are inherently SQL-specific.

**Tradeoff accepted:** No auto-generated migrations, more boilerplate for simple CRUD operations.

---

## 6. Cosine similarity over L2 distance for face matching

**Context:** pgvector supports multiple distance metrics — L2 (`<->`), cosine (`<=>`), and inner product (`<#>`).

**Options considered:**

- L2 (Euclidean distance) — measures absolute distance between vectors
- Cosine similarity — measures angle between vectors, ignores magnitude
- Inner product — related to cosine but not normalized

**Decision:** Cosine similarity (`<=>`).

**Reasoning:** Face embeddings from neural networks encode identity as direction in vector space, not magnitude. Two embeddings of the same person from different photos will point in similar directions regardless of their absolute magnitudes. Cosine similarity captures this correctly. L2 distance is sensitive to magnitude differences which can vary with lighting and image quality.

**Tradeoff accepted:** None significant for this use case.

---

## 7. Similarity threshold at 0.45

**Context:** The similarity search needs a threshold below which matches are discarded. Too high misses genuine matches; too low returns false positives.

**Options considered:** Various values from 0.4 to 0.7.

**Decision:** 0.45, stored as a configurable value in appsettings.

**Reasoning:** Empirically tested with real photos across varying conditions — different lighting, partial occlusion, glasses. Genuine matches clustered around 0.47. False positives appeared below 0.45. A threshold of 0.45 captures genuine matches including edge cases (glasses, partial face) while rejecting clear false positives.

**Tradeoff accepted:** Some borderline cases (heavy occlusion, extreme lighting) may be missed. The threshold is intentionally configurable so it can be tuned without redeployment.

---

## 8. FileProcessingStatus as a state machine

**Context:** Files go through multiple async processing stages after upload. Needed a way to track current state and handle failures at each stage.

**Decision:** `FileProcessingStatus` enum with explicit valid states, tracked in the database.

```
ThumbnailQueued → ThumbnailCompleted → EmbeddingQueued → EmbeddingCompleted
                                                        → Failed
```

**Reasoning:** Treating it as a state machine (not just a status flag) means:

- Invalid transitions can be detected
- Cleanup worker can reason about which files are genuinely stuck
- Retry count column prevents infinite retry loops
- Frontend can show meaningful progress without knowing internal details

**Tradeoff accepted:** More states to manage than a simple pending/complete flag.

---

## 9. Batch status endpoint over individual polling

**Context:** After uploading N files, the frontend needs to track processing status. Polling each file individually would mean N API calls per poll interval.

**Options considered:**

- Individual GET per file — simple, RESTful
- Batch POST with file ID list — one call per interval regardless of N
- Server-Sent Events — server pushes updates, no polling
- WebSockets — full duplex, overkill for server→client updates only

**Decision:** Batch POST endpoint (`POST /files/status/batch`) with progressive reduction.

**Reasoning:** One API call per poll interval regardless of how many files were uploaded. Frontend progressively removes completed files from the polling set, so the batch shrinks over time. SSE would be cleaner but adds infrastructure complexity for marginal UX improvement at this scale.

**Tradeoff accepted:** POST for a read operation is unconventional. Documented explicitly to make intent clear. GET with body was avoided as some proxies strip request bodies on GET requests.

---

## 10. Local disk → Cloudflare R2 for storage

**Context:** Files need to be persisted somewhere accessible to both .NET and Python workers.

**Options considered:**

- Local disk — simple, no latency, free
- AWS S3 — standard, well-supported
- Cloudflare R2 — S3-compatible, no egress fees, generous free tier
- Supabase Storage — S3-compatible, but blocked by Indian ISPs as of Feb 2026

**Decision:** Cloudflare R2.

**Reasoning:** R2 is S3-compatible so the same `AWSSDK.S3` package and `boto3` work without modification. No egress fees means downloading thumbnails for display doesn't incur costs. Free tier (10GB, 1M requests/month) is more than sufficient. Local disk was used during development but is not viable for production — ephemeral on most cloud VMs.

**Tradeoff accepted:** Requires a credit card for account activation. `ForcePathStyle = true` and `DisablePayloadSigning = true` required for R2 compatibility with the AWS SDK.

---

## 11. Multipart streaming for file uploads

**Context:** Users upload multiple images at once, potentially large files. Needed to handle this without loading all files into memory simultaneously.

**Options considered:**

- `IFormFile` — simple, but buffers entire request body in memory
- Manual multipart parsing with streaming — processes one section at a time

**Decision:** Manual multipart parsing using `MultipartReader`.

**Reasoning:** Loading multiple large images into memory simultaneously would cause memory pressure and potential OOM errors. `MultipartReader` processes one file at a time, streaming directly to storage without holding the entire request in RAM. File type validation is done by reading the first 32 bytes (magic bytes) before streaming the rest.

**Tradeoff accepted:** More complex implementation than `IFormFile`. R2 upload requires copying to `MemoryStream` due to AWS SDK content-length requirements — this means one file at a time is in memory, but never all files simultaneously.

---

## 12. WebP for thumbnails

**Context:** Thumbnails are generated from uploaded images for display in search results.

**Options considered:**

- JPEG — universal support, lossy, well-compressed
- WebP — better compression than JPEG, modern browser support

**Decision:** WebP via ImageSharp.

**Reasoning:** WebP provides ~25-35% better compression than JPEG at equivalent quality, meaning smaller files in R2 and faster thumbnail load times. All modern browsers support WebP. ImageSharp provides cross-platform image processing without GDI+ dependencies that are unavailable on Linux.

**Tradeoff accepted:** Older browsers (IE) don't support WebP, not relevant for this use case.

---

## 13. Neon.tech over self-hosted Postgres

**Context:** Postgres needs to be hosted somewhere. Options range from self-hosted on the VM to managed services.

**Options considered:**

- Self-hosted on GCP VM — full control, uses VM RAM
- Supabase — managed Postgres with pgvector, but blocked in India as of Feb 2026
- Neon.tech — serverless Postgres, pgvector support, free tier, no card required

**Decision:** Neon.tech.

**Reasoning:** Running Postgres on the VM would consume ~200MB RAM that is needed for .NET and Python/DeepFace. Neon's free tier includes pgvector support and requires no credit card. Serverless connection pooling handles the low-traffic personal project pattern well. Standard Postgres connection string means zero code changes.

**Tradeoff accepted:** Neon free tier has cold starts after inactivity. First connection after idle period may have slight latency.
