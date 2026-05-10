# SecureLink

Face recognition powered photo search. Upload event photos, find every photo containing your face using just a selfie.

Built as a portfolio project to explore distributed systems, async pipelines, and ML integration in a real-world context.

---

## What it does

- Users upload a batch of event photos
- The system extracts and indexes every face in every photo using DeepFace
- Users upload a selfie to search — the system finds all photos containing their face using vector similarity search
- No manual tagging, no scrolling through hundreds of photos

---

## Architecture

```
React Frontend (Cloudflare Pages)
        │
        │ HTTP
        ▼
    Nginx (reverse proxy)
        │
        ▼
  .NET 10 API
  ├── Auth (JWT + refresh tokens)
  ├── Multipart file upload (streaming)
  ├── Background workers (Channel-based queue)
  │     ├── Thumbnail generation worker
  │     └── Embedding dispatch worker
  └── Similarity search (pgvector)
        │
        ▼
  Python Worker (FastAPI)
  ├── Receives file key via HTTP
  ├── Downloads from R2 storage
  ├── Extracts faces using DeepFace (Facenet512 + RetinaFace)
  ├── Generates 512-dim embeddings
  └── Calls back to .NET API with results
        │
        ▼
  PostgreSQL + pgvector (Neon.tech)
  └── HNSW index on face_embeddings table

  Cloudflare R2
  └── Original images + WebP thumbnails
```

### Processing pipeline

```
Upload
  → store original in R2
  → queue thumbnail job
  → generate WebP thumbnail (ImageSharp)
  → queue embedding job
  → .NET calls Python worker (async, callback pattern)
  → Python downloads thumbnail from R2
  → DeepFace extracts faces + generates embeddings
  → Python calls back to .NET with embeddings
  → .NET stores embeddings in pgvector

Search
  → user uploads selfie
  → .NET streams selfie to Python worker (synchronous)
  → Python returns embedding
  → .NET runs cosine similarity search via pgvector
  → returns matching file IDs + scores
```

---

## Tech stack

| Layer                | Technology                                           |
| -------------------- | ---------------------------------------------------- |
| API                  | .NET 10, ASP.NET Core                                |
| Background jobs      | .NET Channels (in-process queue)                     |
| Face recognition     | Python, FastAPI, DeepFace, Facenet512, RetinaFace    |
| Vector search        | PostgreSQL + pgvector, HNSW index, cosine similarity |
| Database             | Neon.tech (serverless Postgres)                      |
| Storage              | Cloudflare R2 (S3-compatible)                        |
| Thumbnail generation | ImageSharp                                           |
| Frontend             | React, Vite, TypeScript, Tailwind                    |
| HTTP client          | React Query, Axios                                   |
| Reverse proxy        | Nginx                                                |
| Containerization     | Docker, Docker Compose                               |
| CI/CD                | GitHub Actions → ghcr.io → GCP VM                    |
| Hosting              | GCP e2-medium (backend), Cloudflare Pages (frontend) |

---

## Services

### .NET API (`SecureLink.Api`)

Handles auth, file uploads, background job orchestration, and similarity search. Uses a layered architecture — `Api`, `Core`, `Infrastructure`.

Key design decisions are documented in [DECISIONS.md](./DECISIONS.md).

### Python Worker (`python-worker`)

Lightweight FastAPI service responsible only for face embedding generation. Communicates with the .NET API via HTTP — receives a storage key, downloads the file, processes it, and calls back with results. Stateless and independently deployable.

### Background Workers

Two in-process workers using .NET `Channel<T>`:

- `ThumbnailBackgroundService` — generates compressed WebP thumbnails
- `EmbeddingBackgroundService` — dispatches embedding jobs to the Python worker

Both implement exponential backoff retry with a max retry count. A scheduled cleanup worker handles files stuck in intermediate states.

---

## File processing states

```
ThumbnailQueued → ThumbnailCompleted → EmbeddingQueued → EmbeddingCompleted
                                                        → Failed
```

State tracked in `file_processing_status` column. Frontend polls a batch status endpoint every 3 seconds, progressively removing completed files from the polling set.

---

## Running locally

### Prerequisites

- .NET 10 SDK
- Python 3.11+
- PostgreSQL with pgvector extension
- Cloudflare R2 bucket (or local storage for development)

### .NET API

```bash
cd SecureLink.Api
cp appsettings.Development.json.example appsettings.Development.json
# fill in your config values
dotnet run
```

### Python worker

```bash
cd python-worker
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# fill in your config values
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd securelink-ui
npm install
cp .env.example .env.local
# set VITE_API_BASE_URL=http://localhost:5009
npm run dev
```

### Docker Compose (all services)

```bash
# copy and fill in env vars
cp .env.example .env

docker compose up -d
```

API available at `http://localhost:80` via Nginx, or `http://localhost:5009` directly.

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full deployment guide.

Stack: GCP e2-medium → Docker Compose → Nginx → .NET API + Python worker. Database on Neon.tech, storage on Cloudflare R2, frontend on Cloudflare Pages.

CI/CD: push to `main` → GitHub Actions builds and pushes Docker images to ghcr.io → SSH into VM → `deploy.sh` pulls and restarts containers.

---

## Project structure

```
SecureLink/
├── SecureLink.Api/              .NET API — controllers, middleware, program setup
├── SecureLink.Core/             domain models, interfaces, contracts
├── SecureLink.Infrastructure/   repositories, services, background workers
│   ├── BackgroundServices/      thumbnail + embedding workers, cleanup job
│   ├── Repositories/            Dapper + raw SQL, pgvector queries
│   └── Services/                file, auth, embedding, storage services
├── SecureLink.FaceRecognitionService/               FastAPI service for face embedding generation
│   ├── routers/                 HTTP endpoints
│   └── services/                DeepFace wrapper, storage client, HTTP client
├── SecureLink.UI/               React frontend
│   ├── hooks/                   useFileUpload, useFileSearch, useAuth, etc.
│   ├── api/                     Axios API clients
│   └── pages/                   Portfolio, SecureLink landing, Login, Dashboard
├── docker-compose.yml
├── docker-compose.production.yml
├── nginx/
│   └── nginx.conf
├── DEPLOYMENT.md
└── DECISIONS.md
```

---

## Known limitations and future work

- In-memory Channel queue does not survive process restarts — jobs in flight are lost on crash. Designed to be replaced with Redis Streams or a persistent queue.
- Similarity threshold (0.45 cosine) is tuned empirically on a small dataset — may need adjustment for diverse lighting conditions or image quality.
- No multi-tenancy or group sharing yet, each user searches only their own uploaded photos.
- Python worker models are loaded at startup and kept in memory — cold start after inactivity takes ~10-15 seconds on first request.

---

## Author

Vishwas Yogi — Full Stack Developer  
[GitHub](https://github.com/vishwas-yogi) · [LinkedIn](https://linkedin.com/in/vishwas-yogi)
