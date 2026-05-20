@echo off
title FitEating Launcher

REM ===== Backend (FastAPI / uvicorn on :8001) =====
start "FitEating Backend" /min cmd /k "cd /d C:\Project\FitEating-main\backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8001"

REM ===== Frontend (Vite on :5173) =====
start "FitEating Frontend" /min cmd /k "cd /d C:\Project\FitEating-main\frontend && npm run dev"

REM ===== Wait for servers, then open browser =====
timeout /t 10 /nobreak >nul
start "" "http://localhost:5173/"

exit
