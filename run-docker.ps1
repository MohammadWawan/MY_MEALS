# Script to run Hospital POS via Docker
Write-Host "Starting Hospital POS via Docker Compose..." -ForegroundColor Cyan

# Check for Docker Compose v2 (docker compose) or v1 (docker-compose)
if (Get-Command "docker-compose" -ErrorAction SilentlyContinue) {
    docker-compose up --build -d
} elseif (Get-Command "docker" -ErrorAction SilentlyContinue) {
    docker compose up --build -d
} else {
    Write-Error "Docker not found in your system's PATH. Please ensure Docker Desktop is installed and running."
    exit 1
}

Write-Host "System is starting! Access it at http://localhost:3000" -ForegroundColor Green
