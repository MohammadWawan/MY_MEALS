#!/bin/bash
# Script to run Hospital POS via Docker
echo "Starting Hospital POS via Docker Compose..."

# Check if docker-compose exists
if command -v docker-compose &> /dev/null
then
    docker-compose up --build -d
elif docker help compose &> /dev/null
then
    docker compose up --build -d
else
    echo "Error: Docker or Docker Compose not found. Please ensure it's installed and running."
    exit 1
fi

echo "System is starting! Access it at http://localhost:3000"
