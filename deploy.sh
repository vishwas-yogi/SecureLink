#!/bin/bash
set -e

echo "Starting SecureLink Deployment..."
cd ~/securelink

echo "Pulling latest images from GHCR..."
# This ensures we have the latest .NET and Python images before starting
docker compose -f docker-compose.yml -f docker-compose.production.yml pull

echo "Recreating containers..."
docker compose -f docker-compose.yml -f docker-compose.production.yml up -d --remove-orphans

echo "Cleaning up old, unused image layers..."
docker image prune -f

echo "Deployment Successful!"
docker compose -f docker-compose.yml -f docker-compose.production.yml ps

echo "Performing disk cleanup..."
# This ensures we don't leave any "ghost" layers behind after the new version is up
docker image prune -a -f