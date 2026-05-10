# Deployment Guide

Backend on GCP free credits · Database on Neon.tech · Storage on Cloudflare R2 · Frontend on Cloudflare Pages

---

## Architecture

```
Cloudflare Pages (free)
  your-project.pages.dev  →  React frontend
        │
        │ HTTP API calls
        ▼
GCP e2-medium VM (~$25/month via $300 free credits)
        │
        ▼
Nginx (reverse proxy, port 80)
        │
        ▼
  .NET API (port 5009, internal)
  Python Worker (port 8000, internal only)

Neon.tech (free): Postgres + pgvector
Cloudflare R2 (free tier): image + thumbnail storage
```

---

## Prerequisites

- GCP account with $300 free credits
- Neon.tech account (free, no card required)
- Cloudflare account (R2 requires card for activation)
- GitHub account

---

## Part 1 — Neon.tech Setup

### 1.1 Create project

1. Sign up at https://neon.tech (GitHub login works)
2. New Project → choose region closest to your GCP VM region
3. Copy the connection string — looks like:

```
postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

> Always append `?sslmode=require` — Neon rejects non-SSL connections.

### 1.2 Enable pgvector

In Neon SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 1.3 Run migrations

Run `dotnet run --migrate`

---

## Part 2 — Cloudflare R2 Setup

### 2.1 Create bucket

1. Cloudflare Dashboard → R2 Object Storage → Create Bucket
2. Name: `securelink-uploads`
3. Region: Automatic

### 2.2 Get API credentials

1. R2 → Manage R2 API Tokens → Create API Token
2. Permissions: Object Read & Write
3. Save: Access Key ID, Secret Access Key, Account ID

Your S3-compatible endpoint:

```
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

---

## Part 3 — GCP VM Setup

### 3.1 Create instance

1. GCP Console → Compute Engine → Create Instance
2. Name: `securelink-vm`
3. Region: `us-central1`, `us-east1`, or `us-west1` only
   > Other regions consume credits faster
4. Machine type: e2-medium (2 vCPU, 4GB RAM)
5. Boot disk: Ubuntu 22.04 LTS, Standard persistent disk, 30GB
6. Firewall: Allow HTTP, Allow HTTPS
7. Note the external IP

### 3.2 Set budget alert

Before anything else:

```
GCP Console → Billing → Budgets & Alerts → Create Budget
Amount: $50
Alerts: 50%, 90%, 100%
```

### 3.3 Initial VM access

Use GCP Console browser SSH to connect as the default user.

### 3.4 Create non-root user

```bash
sudo adduser vishwas
sudo usermod -aG sudo vishwas
sudo apt install rsync -y
sudo rsync --archive --chown=vishwas:vishwas ~/.ssh /home/vishwas
```

### 3.5 Add SSH key for new user (GCP method)

In GCP Console → VM Instance → Edit → SSH Keys → Add Item:

- Paste your local public key (`cat ~/.ssh/id_rsa.pub`)
- Change the username at the end of the key to `vishwas`
- Save

Verify SSH works from your local machine before hardening:

```bash
ssh -i ~/.ssh/id_rsa vishwas@YOUR_VM_IP
```

### 3.6 Harden SSH

Only do this after verifying SSH key login works:

```bash
sudo nano /etc/ssh/sshd_config
# set:
# PermitRootLogin no
# PasswordAuthentication no
sudo systemctl restart sshd
```

### 3.7 Configure firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

Also open ports in GCP Console:

```
VPC Network → Firewall → Create Firewall Rule
Name: allow-http-https
Targets: All instances in the network
Source: 0.0.0.0/0
Ports: TCP 80, 443
```

> GCP has its own firewall layer on top of UFW. Both need to be configured.

### 3.8 Install Docker

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo apt install docker-compose-plugin -y
```

Log out and back in, then verify:

```bash
docker ps
docker compose version
```

---

## Part 4 — Project Files on VM

### 4.1 Create directory structure

```bash
mkdir -p ~/securelink/nginx
```

### 4.2 Copy files from local machine

```bash
# run from your local project root
scp docker-compose.yml vishwas@YOUR_VM_IP:~/securelink/
scp docker-compose.production.yml vishwas@YOUR_VM_IP:~/securelink/
scp nginx/nginx.conf vishwas@YOUR_VM_IP:~/securelink/nginx/
```

### 4.3 Create .env on the VM

Create this directly on the VM — never transfer secrets via SCP:

```bash
nano ~/securelink/.env
```

```env
DATABASE_URL=postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your_strong_jwt_secret
INTERNAL_SECRET=your_internal_secret
STORAGE_BUCKET=securelink-uploads
STORAGE_ACCESS_KEY=your_r2_access_key_id
STORAGE_SECRET_KEY=your_r2_secret_access_key
STORAGE_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
STORAGE_REGION=auto
```

### 4.4 Create deploy.sh

```bash
nano ~/securelink/deploy.sh
```

```bash
#!/bin/bash
set -e

echo "Deploying SecureLink..."
cd ~/securelink

echo "Pulling latest images..."
docker compose -f docker-compose.yml -f docker-compose.production.yml pull

echo "Restarting services..."
docker compose -f docker-compose.yml -f docker-compose.production.yml up -d --no-deps dotnet-api
docker compose -f docker-compose.yml -f docker-compose.production.yml up -d --no-deps python-worker

echo "Reloading nginx..."
docker compose exec nginx nginx -s reload

echo "Cleaning old images..."
docker image prune -f

echo "Done!"
docker compose -f docker-compose.yml -f docker-compose.production.yml ps
```

```bash
chmod +x ~/securelink/deploy.sh
```

### 4.5 Login to GitHub Container Registry

Generate a PAT on GitHub with `read:packages` scope:

```
GitHub → Settings → Developer Settings → Personal Access Tokens → Fine-grained
Permissions: read:packages only
```

Then on the VM:

```bash
echo YOUR_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

---

## Part 5 — Docker Compose Files

### docker-compose.yml (base, committed to repo)

```yaml
services:
  dotnet-api:
    image: ghcr.io/vishwas-yogi/securelink-api:latest
    container_name: securelink-api
    restart: unless-stopped
    environment:
      - ConnectionStrings__DefaultConnection=${DATABASE_URL}
      - JwtSettings__Secret=${JWT_SECRET}
      - InternalSecret=${INTERNAL_SECRET}
      - Storage__Bucket=${STORAGE_BUCKET}
      - Storage__AccessKey=${STORAGE_ACCESS_KEY}
      - Storage__SecretKey=${STORAGE_SECRET_KEY}
      - Storage__Endpoint=${STORAGE_ENDPOINT}
      - Storage__Region=${STORAGE_REGION}
      - PythonWorker__BaseUrl=http://python-worker:8000
      - ASPNETCORE_URLS=http://+:5009
    ports:
      - "5009:5009"
    networks:
      - securelink-network

  python-worker:
    image: ghcr.io/vishwas-yogi/securelink-python:latest
    container_name: securelink-python
    restart: unless-stopped
    environment:
      - DOTNET_BASE_URL=http://dotnet-api:5009
      - INTERNAL_API_KEY=${INTERNAL_SECRET}
      - STORAGE_BUCKET=${STORAGE_BUCKET}
      - STORAGE_ACCESS_KEY=${STORAGE_ACCESS_KEY}
      - STORAGE_SECRET_KEY=${STORAGE_SECRET_KEY}
      - STORAGE_ENDPOINT=${STORAGE_ENDPOINT}
      - STORAGE_REGION=${STORAGE_REGION}
    ports:
      - "8000:8000"
    networks:
      - securelink-network

  nginx:
    image: nginx:alpine
    container_name: securelink-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      # - "443:443"  # uncomment after SSL setup
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      # - certbot-certs:/etc/letsencrypt:ro      # uncomment after SSL setup
      # - certbot-www:/var/www/certbot:ro         # uncomment after SSL setup
    depends_on:
      - dotnet-api
    networks:
      - securelink-network

  # certbot:                              # uncomment after domain is ready
  #   image: certbot/certbot
  #   volumes:
  #     - certbot-certs:/etc/letsencrypt
  #     - certbot-www:/var/www/certbot

# volumes:
#   certbot-certs:
#   certbot-www:

networks:
  securelink-network:
    driver: bridge
```

### docker-compose.production.yml (on VM only, not committed)

Removes port exposure for security — only nginx is publicly accessible:

```yaml
services:
  dotnet-api:
    ports: []

  python-worker:
    ports: []
```

### nginx/nginx.conf (HTTP only for now)

```nginx
events {
    worker_connections 1024;
}

http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    server {
        listen 80;
        server_name _;

        location / {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://dotnet-api:5009;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $host;
            proxy_set_header X-Forwarded-Port $server_port;
            client_max_body_size 100M;
        }
    }
}
```

---

## Part 6 — Dockerfiles

### SecureLink.Api/Dockerfile

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5009

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["SecureLink.Api/SecureLink.Api.csproj", "SecureLink.Api/"]
COPY ["SecureLink.Core/SecureLink.Core.csproj", "SecureLink.Core/"]
COPY ["SecureLink.Infrastructure/SecureLink.Infrastructure.csproj", "SecureLink.Infrastructure/"]
RUN dotnet restore "SecureLink.Api/SecureLink.Api.csproj"
COPY . .
RUN dotnet publish "SecureLink.Api/SecureLink.Api.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "SecureLink.Api.dll"]
```

### python-worker/Dockerfile

```dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    libglib2.0-0 libsm6 libxext6 libxrender-dev libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# pre-download model at build time — avoids cold start delay after deploy
RUN python -c "from deepface import DeepFace; DeepFace.build_model('Facenet512')"

COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Part 7 — GitHub Actions CI/CD

### Add secrets to GitHub repo

```
Repo → Settings → Secrets and variables → Actions → New secret

VPS_HOST     → GCP VM external IP
VPS_USER     → vishwas
VPS_SSH_KEY  → contents of ~/.ssh/id_rsa (your local private key)
```

`GITHUB_TOKEN` is injected automatically — do not add it manually.

### .github/workflows/deploy.yml

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

env:
  DOTNET_IMAGE: ghcr.io/${{ github.repository_owner }}/securelink-api
  PYTHON_IMAGE: ghcr.io/${{ github.repository_owner }}/securelink-python

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push .NET API
        uses: docker/build-push-action@v5
        with:
          context: .
          file: SecureLink.Api/Dockerfile
          push: true
          tags: ${{ env.DOTNET_IMAGE }}:latest

      - name: Build and push Python Worker
        uses: docker/build-push-action@v5
        with:
          context: ./python-worker
          push: true
          tags: ${{ env.PYTHON_IMAGE }}:latest

      - name: Deploy to GCP VM
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd ~/securelink
            ./deploy.sh
```

---

## Part 8 — Frontend on Cloudflare Pages

### Build config

Create `securelink-ui/.env.production`:

```env
VITE_API_BASE_URL=http://YOUR_GCP_VM_IP
```

Update to HTTPS domain after SSL is set up.

### Deploy steps

1. Push frontend to GitHub
2. Cloudflare Dashboard → Pages → Create Project
3. Connect GitHub repo
4. Build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Root directory: `securelink-ui`
5. Add environment variable: `VITE_API_BASE_URL=http://YOUR_GCP_VM_IP`
6. Deploy

Cloudflare Pages gives you a free `your-project.pages.dev` URL immediately — no custom domain needed to start testing.

---

## Part 9 — SSL Setup (after domain is obtained)

Skip this section until you have a domain pointed at the VM.

### Update nginx.conf for SSL

```nginx
events {
    worker_connections 1024;
}

http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    server {
        listen 80;
        server_name api.yourdomain.dev;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    server {
        listen 443 ssl;
        server_name api.yourdomain.dev;

        ssl_certificate /etc/letsencrypt/live/api.yourdomain.dev/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.dev/privkey.pem;

        add_header X-Frame-Options "SAMEORIGIN";
        add_header X-Content-Type-Options "nosniff";

        location / {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://dotnet-api:5009;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            client_max_body_size 100M;
        }
    }
}
```

### Uncomment certbot in docker-compose.yml

Uncomment the certbot service and volumes, then:

```bash
# get certificate
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  -d api.yourdomain.dev \
  --email your@email.com \
  --agree-tos \
  --non-interactive

docker compose up -d
```

### Auto-renew

```bash
crontab -e
# add:
0 0 * * * docker compose -f ~/securelink/docker-compose.yml run --rm certbot renew \
  && docker compose -f ~/securelink/docker-compose.yml exec nginx nginx -s reload
```

---

## Quick reference

```bash
# check service status
docker compose -f docker-compose.yml -f docker-compose.production.yml ps

# view logs
docker compose logs -f dotnet-api
docker compose logs -f python-worker
docker compose logs -f nginx

# restart single service
docker compose -f docker-compose.yml -f docker-compose.production.yml restart dotnet-api

# manual deploy
cd ~/securelink && ./deploy.sh

# check memory
free -h

# check disk
df -h
```

---

## Deployment checklist

**Neon:**

- [ ] Project created, region selected
- [ ] pgvector extension enabled
- [ ] All migrations run
- [ ] Connection string saved with `?sslmode=require`

**Cloudflare R2:**

- [ ] Bucket created
- [ ] API token generated (read/write)
- [ ] Access key, secret key, account ID saved

**GCP VM:**

- [ ] e2-medium instance created (us-central1)
- [ ] Budget alert set
- [ ] Non-root user `vishwas` created
- [ ] SSH key added via GCP Console metadata
- [ ] SSH key login verified before hardening
- [ ] SSH hardened (PasswordAuthentication no)
- [ ] UFW firewall configured
- [ ] GCP firewall rules created for port 80, 443
- [ ] Docker installed and working without sudo
- [ ] `~/securelink/` directory created
- [ ] `docker-compose.yml`, `nginx.conf` copied via SCP
- [ ] `.env` created directly on VM
- [ ] `deploy.sh` created and executable
- [ ] ghcr.io login done with PAT

**GitHub:**

- [ ] `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` secrets added
- [ ] GitHub Actions workflow file added
- [ ] Workflow triggered and passing

**Frontend:**

- [ ] Cloudflare Pages project created
- [ ] `VITE_API_BASE_URL` env var set to VM IP
- [ ] Deployed and accessible at `pages.dev` URL

**Testing:**

- [ ] API reachable at `http://VM_IP/api/...`
- [ ] Register, login, upload, search working end to end
