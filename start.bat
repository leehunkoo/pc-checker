@echo off
chcp 65001 >nul
title PC 보안 자가점검

echo.
echo  PC 보안 자가점검 시스템 시작 중...
echo  브라우저에서 http://localhost:3000 이 자동으로 열립니다.
echo  이 창을 닫으면 앱이 종료됩니다.
echo.

start /b cmd /c "timeout /t 3 >nul && start http://localhost:3000"
npm run dev

pause
