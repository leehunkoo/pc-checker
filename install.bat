@echo off
chcp 65001 >nul
title PC 보안 자가점검 - 설치 및 실행

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║     PC 보안 자가점검 시스템 설치 및 실행     ║
echo  ╚══════════════════════════════════════════╝
echo.

:: 관리자 권한 확인
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo  [!] 관리자 권한으로 실행해주세요.
    echo      이 파일을 우클릭 ^> "관리자 권한으로 실행"
    pause
    exit /b 1
)

:: Node.js 설치 확인
echo  [1/4] Node.js 설치 확인 중...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo  [!] Node.js가 설치되어 있지 않습니다.
    echo      Node.js 공식 사이트에서 LTS 버전을 설치해주세요.
    echo      https://nodejs.org
    echo.
    echo  설치 후 이 파일을 다시 실행하세요.
    start https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER% 확인됨

:: Python 설치 확인
echo  [2/4] Python 설치 확인 중...
python --version >nul 2>&1
if %errorLevel% neq 0 (
    python3 --version >nul 2>&1
    if %errorLevel% neq 0 (
        echo  [!] Python이 설치되어 있지 않습니다.
        echo      PDF/Excel 보고서 기능을 사용하려면 Python이 필요합니다.
        echo      https://python.org 에서 설치 후 재실행하거나,
        echo      보고서 기능 없이 계속하려면 아무 키나 누르세요.
        start https://python.org
        pause
    )
) else (
    for /f "tokens=*" %%v in ('python --version 2^>^&1') do set PY_VER=%%v
    echo  [OK] %PY_VER% 확인됨

    :: Python 패키지 설치
    echo  [3/4] Python 패키지 설치 중... (reportlab, openpyxl)
    python -m pip install reportlab openpyxl --quiet --break-system-packages >nul 2>&1
    if %errorLevel% neq 0 (
        python -m pip install reportlab openpyxl --quiet >nul 2>&1
    )
    echo  [OK] Python 패키지 설치 완료
)

:: npm 패키지 설치
echo  [4/4] 앱 패키지 설치 중... (최초 1회, 수분 소요)
if not exist "node_modules" (
    call npm install --legacy-peer-deps >nul 2>&1
    echo  [OK] 패키지 설치 완료
) else (
    echo  [OK] 패키지 이미 설치됨
)

:: scripts 폴더 확인
if not exist "scripts" mkdir scripts

echo.
echo  ══════════════════════════════════════════
echo   설치 완료! 앱을 시작합니다...
echo   브라우저에서 http://localhost:3000 이 자동으로 열립니다.
echo   이 창을 닫으면 앱이 종료됩니다.
echo  ══════════════════════════════════════════
echo.

:: 3초 후 브라우저 자동 오픈
start /b cmd /c "timeout /t 3 >nul && start http://localhost:3000"

:: 앱 실행
npm run dev

pause
