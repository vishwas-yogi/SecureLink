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