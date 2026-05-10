#!/bin/bash
set -e

echo "Deploying SecureLink..."
cd ~/securelink

echo "Pulling latest images..."
docker compose pull

echo "Restarting services..."
docker compose up -d --no-deps dotnet-api
docker compose up -d --no-deps python-worker

echo "Cleaning old images..."
docker image prune -f

echo "Done!"
docker compose ps