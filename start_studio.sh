#!/usr/bin/env bash
# ===================================================================
# ACE RESEARCH STUDIO — QUICKSTART LAUNCHER
# Starts the Python API server and Vite Frontend
# ===================================================================

set -e

echo "=== Starting ACE Research Studio ==="

# Check mode: backend, frontend, or both
MODE="${1:-both}"

if [ "$MODE" = "api" ]; then
    echo "Starting Python API Server on http://localhost:8000..."
    uv run python web_api.py
elif [ "$MODE" = "frontend" ]; then
    echo "Starting Vite Frontend Dev Server on http://localhost:5173..."
    npm --prefix web run dev
else
    echo "Mode: Fullstack"
    echo "1. Building frontend production bundle..."
    npm --prefix web run build
    echo "2. Launching FastAPI server (serving frontend + API + Graphify) on http://localhost:8000..."
    uv run python web_api.py
fi
