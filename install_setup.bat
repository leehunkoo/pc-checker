@echo off
chcp 65001 >nul
title PC 보안 자가점검 - 설치

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║     PC 보안 자가점검 시스템 설치 중...      ║
echo  ╚══════════════════════════════════════════╝
echo.

:: 바탕화면 경로 자동 감지
for /f "tokens=*" %%D in ('powershell -NoProfile -Command "[Environment]::GetFolderPath(\"Desktop\")"') do set DESKTOP=%%D
set INSTALL_DIR=%DESKTOP%\보안점검
set SOURCE_DIR=%~dp0

echo  설치 경로: %INSTALL_DIR%
echo.

:: ── 설치 폴더 생성 ────────────────────────────────────────
echo  [1/4] 설치 폴더 생성 중...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

:: ── 파일 복사 ─────────────────────────────────────────────
echo  [2/4] 앱 파일 설치 중... (잠시 기다려주세요)
robocopy "%SOURCE_DIR%app"     "%INSTALL_DIR%\app"     /E /NFL /NDL /NJH /NJS >nul 2>&1
robocopy "%SOURCE_DIR%runtime" "%INSTALL_DIR%\runtime" /E /NFL /NDL /NJH /NJS >nul 2>&1
copy "%SOURCE_DIR%launcher.bat"  "%INSTALL_DIR%\launcher.bat"  >nul
copy "%SOURCE_DIR%version.txt"   "%INSTALL_DIR%\version.txt"   >nul

:: ── 바탕화면 바로가기 생성 ────────────────────────────────
echo  [3/4] 바탕화면 바로가기 생성 중...
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut('%DESKTOP%\PC 보안점검.lnk'); $sc.TargetPath = '%INSTALL_DIR%\launcher.bat'; $sc.WorkingDirectory = '%INSTALL_DIR%'; $sc.Description = 'PC 보안 자가점검 시스템'; $sc.IconLocation = 'shell32.dll,48'; $sc.Save()"

:: ── 시작 메뉴 바로가기 생성 ───────────────────────────────
echo  [4/4] 시작 메뉴 등록 중...
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $sm = [Environment]::GetFolderPath('StartMenu') + '\Programs'; $sc = $ws.CreateShortcut($sm + '\PC 보안점검.lnk'); $sc.TargetPath = '%INSTALL_DIR%\launcher.bat'; $sc.WorkingDirectory = '%INSTALL_DIR%'; $sc.Description = 'PC 보안 자가점검 시스템'; $sc.IconLocation = 'shell32.dll,48'; $sc.Save()"

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║             설치 완료!                     ║
echo  ║                                          ║
echo  ║  바탕화면의 "PC 보안점검" 을               ║
echo  ║  더블클릭하여 실행하세요.                  ║
echo  ╚══════════════════════════════════════════╝
echo.

set /p RUN_NOW="지금 바로 실행하시겠습니까? (Y/N): "
if /i "%RUN_NOW%"=="Y" start "" "%INSTALL_DIR%\launcher.bat"

pause
