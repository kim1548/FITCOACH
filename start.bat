@echo off
chcp 65001 >nul
title FITCOACH Launcher
setlocal

REM 이 .bat 파일 자신의 위치를 기준 폴더로
cd /d "%~dp0"

REM --- 사전 점검: setup.bat 먼저 실행됐는지 ---
if not exist "backend\venv\Scripts\python.exe" (
    echo [ERROR] backend\venv 가 없습니다. 먼저 setup.bat 을 실행하세요.
    pause
    exit /b 1
)
if not exist "frontend\node_modules" (
    echo [ERROR] frontend\node_modules 가 없습니다. 먼저 setup.bat 을 실행하세요.
    pause
    exit /b 1
)

REM --- Backend (FastAPI / uvicorn on :8001) ---
start "FITCOACH Backend" /min cmd /k "cd /d %~dp0backend && call venv\Scripts\activate && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001"

REM --- Frontend (Vite on :5173) ---
start "FITCOACH Frontend" /min cmd /k "cd /d %~dp0frontend && npm run dev"

REM --- 서버 부팅 대기 후 브라우저 자동 오픈 ---
timeout /t 8 /nobreak >nul
start "" "http://localhost:5173/"

endlocal
exit
