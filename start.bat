@echo off
chcp 65001 >nul
title PC 보안 자가점검
cd /d "%~dp0"
if not exist node_modules (
    echo 패키지 설치 중..
    call npm install --legacy-peer-deps
)
start /b cmd /c "timeout /t 3 >nul && start http://localhost:3000"
npm run dev
pause
