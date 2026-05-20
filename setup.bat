@echo off
chcp 65001 >nul
title FITCOACH Initial Setup
setlocal

REM 이 .bat 파일 자신의 위치를 기준 폴더로 (어디서 더블클릭해도 동작)
cd /d "%~dp0"

echo.
echo ===== FITCOACH 초기 셋업을 시작합니다 =====
echo (처음 한 번만 실행. 10~15분 소요)
echo.

REM --- [점검 1/2] Python 3.10 ---
py -3.10 --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python 3.10 이 설치되어 있지 않습니다.
    echo https://www.python.org/downloads/release/python-31011/ 에서 설치하세요.
    echo 설치 시 "Add Python to PATH" 체크 필수.
    pause
    exit /b 1
)

REM --- [점검 2/2] Node.js ---
node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js 가 설치되어 있지 않습니다.
    echo https://nodejs.org 에서 LTS 버전을 설치하세요.
    pause
    exit /b 1
)

echo [확인] Python 3.10 / Node.js OK
echo.

REM --- [1/4] backend venv 생성 ---
echo [1/4] Python 가상환경 생성 중...
if exist "backend\venv\Scripts\python.exe" (
    echo       이미 존재. 건너뜁니다.
) else (
    pushd backend
    py -3.10 -m venv venv
    popd
)

REM --- [2/4] PyTorch CPU 빌드 (PyTorch 공식 인덱스에서) ---
echo.
echo [2/4] PyTorch CPU 빌드 설치 중... (5분 정도)
call backend\venv\Scripts\activate
python -m pip install --upgrade pip
pip install torch==2.11.0+cpu torchvision==0.26.0+cpu torchaudio==2.11.0+cpu --index-url https://download.pytorch.org/whl/cpu
if errorlevel 1 (
    echo [ERROR] PyTorch 설치 실패.
    pause
    exit /b 1
)

REM --- [3/4] 나머지 Python 의존성 ---
echo.
echo [3/4] 나머지 Python 의존성 설치 중... (5분 정도)
pip install -r backend\requirements.txt
if errorlevel 1 (
    echo [ERROR] requirements.txt 설치 실패.
    pause
    exit /b 1
)
call backend\venv\Scripts\deactivate.bat

REM --- [4/4] 프론트엔드 node_modules ---
echo.
echo [4/4] 프론트엔드 의존성 설치 중... (2~3분)
pushd frontend
call npm install
if errorlevel 1 (
    echo [ERROR] npm install 실패.
    popd
    pause
    exit /b 1
)
popd

echo.
echo ===========================================================
echo  셋업 완료! 이제 start.bat 더블클릭으로 실행하세요.
echo.
echo  AI 기능을 쓰려면 다음 자산을 별도로 받아 위치에 두세요:
echo    - backend\app\models\   (ML 모델 .pt / .pth)
echo    - backend\app\data\     (데이터셋 CSV)
echo    - yolov8n.pt            (프로젝트 루트)
echo ===========================================================
echo.
pause
endlocal
