@echo off
chcp 65001 >nul
title PC 보안 자가점검 - 설치
cd /d "%~dp0"
echo [1/3] Node.js 확인 중..
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo Node.js가 없습니다. https://nodejs.org 에서 설치하세요.
    start https://nodejs.org
    pause
    exit /b 1
)
echo [2/3] npm 패키지 설치 중.. (1-2분 소요)
call npm install --legacy-peer-deps
echo [3/3] 완료! 앱을 시작합니다..
start /b cmd /c "timeout /t 5 >nul && start http://localhost:3000"
npm run dev
pause
