@echo off
chcp 65001 >nul
title 업데이트 패키지 생성 - 관리자용

:: ── ★ 관리자가 수정할 항목 ★ ─────────────────────────────
set APP_DIR=%USERPROFILE%\Desktop\보안 개발폴더\pc-security-checker 개발폴더\pc-security-checker
set NAS_PATH=\\NAS주소\보안점검배포
set NEW_VERSION=1.1
:: ────────────────────────────────────────────────────────

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║      업데이트 패키지 생성 (v%NEW_VERSION%)        ║
echo  ╚══════════════════════════════════════════╝
echo.

:: 임시 폴더 초기화
if exist "%TEMP%\pc_update_pkg" rmdir /s /q "%TEMP%\pc_update_pkg"
mkdir "%TEMP%\pc_update_pkg\app"

echo  [1/3] 앱 파일 수집 중...
robocopy "%APP_DIR%\src"     "%TEMP%\pc_update_pkg\app\src"     /E /NFL /NDL /NJH /NJS >nul
robocopy "%APP_DIR%\public"  "%TEMP%\pc_update_pkg\app\public"  /E /NFL /NDL /NJH /NJS >nul
robocopy "%APP_DIR%\scripts" "%TEMP%\pc_update_pkg\app\scripts" /E /NFL /NDL /NJH /NJS >nul
copy "%APP_DIR%\package.json"       "%TEMP%\pc_update_pkg\app\" >nul
copy "%APP_DIR%\next.config.js"     "%TEMP%\pc_update_pkg\app\" >nul 2>&1
copy "%APP_DIR%\next.config.ts"     "%TEMP%\pc_update_pkg\app\" >nul 2>&1
copy "%APP_DIR%\tsconfig.json"      "%TEMP%\pc_update_pkg\app\" >nul
copy "%APP_DIR%\tailwind.config.js" "%TEMP%\pc_update_pkg\app\" >nul 2>&1
copy "%APP_DIR%\postcss.config.js"  "%TEMP%\pc_update_pkg\app\" >nul 2>&1

echo  [2/3] ZIP 압축 중...
if exist "%TEMP%\update.zip" del /f /q "%TEMP%\update.zip"
powershell -NoProfile -Command "Compress-Archive -Path '%TEMP%\pc_update_pkg\app' -DestinationPath '%TEMP%\update.zip' -Force"

echo  [3/3] NAS에 업로드 중...
if not exist "%NAS_PATH%" (
    echo  [오류] NAS 경로에 접근할 수 없습니다: %NAS_PATH%
    pause
    exit /b 1
)
copy "%TEMP%\update.zip" "%NAS_PATH%\update.zip" >nul
echo %NEW_VERSION%> "%NAS_PATH%\version.txt"

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║  배포 완료! v%NEW_VERSION%                        ║
echo  ║                                          ║
echo  ║  사용자가 다음 실행 시 업데이트 팝업이     ║
echo  ║  자동으로 표시됩니다.                     ║
echo  ╚══════════════════════════════════════════╝
echo.
pause
