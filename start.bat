@echo off
chcp 65001 >nul
title PC 보안 자가점검

echo.
echo  PC 보안 자가점검 시스템 시작 중...
echo  브라우저에서 http://localhost:3000 이 자동으로 열립니다.
echo  이 창을 닫으면 앱이 종료됩니다.
echo.

start /b powershell -WindowStyle Hidden -Command "for($i=0;$i-lt30;$i++){Start-Sleep 2;try{$t=New-Object Net.Sockets.TcpClient;$t.Connect('127.0.0.1',3000);$t.Close();Start-Process 'http://localhost:3000';exit}catch{}}"
npm run dev

pause
