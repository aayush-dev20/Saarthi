@echo off
title Saarthi Smart Campus Platform
echo ========================================================
echo Starting Saarthi Smart Campus Platform (Frontend + Backend)
echo ========================================================
cd /d "%~dp0"
echo 1. Starting Backend Server on http://localhost:5000 ...
start "Saarthi Backend (Port 5000)" cmd /k "node server/index.js"
echo 2. Starting Frontend Dev Server on http://localhost:5173 ...
start "Saarthi Frontend (Port 5173)" cmd /k "npx vite --port 5173 --host"
echo.
echo ========================================================
echo Servers are running!
echo Access the platform at:
echo   Local Frontend:  http://localhost:5173/  (or http://127.0.0.1:5173/)
echo   Local Backend:   http://localhost:5000/  (or http://127.0.0.1:5000/)
echo ========================================================
pause
