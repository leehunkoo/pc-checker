@echo off
chcp 65001 >nul
title 설치 EXE 빌드

set APP_DIR=%USERPROFILE%\Desktop\보안 개발폴더\pc-security-checker 개발폴더\pc-security-checker
set NSIS="C:\Program Files (x86)\NSIS\makensis.exe"

echo.
echo  EXE 빌드 시작...
echo  (파일 크기가 커서 5~10분 소요됩니다)
echo.

cd /d "%APP_DIR%"

:: app 폴더 구성 (src, scripts, public, package.json 등 묶기)
if exist "%APP_DIR%\app" rmdir /s /q "%APP_DIR%\app"
mkdir "%APP_DIR%\app"

robocopy "%APP_DIR%\src"      "%APP_DIR%\app\src"      /E /NFL /NDL /NJH /NJS >nul
robocopy "%APP_DIR%\public"   "%APP_DIR%\app\public"   /E /NFL /NDL /NJH /NJS >nul
robocopy "%APP_DIR%\scripts"  "%APP_DIR%\app\scripts"  /E /NFL /NDL /NJH /NJS >nul
robocopy "%APP_DIR%\node_modules" "%APP_DIR%\app\node_modules" /E /NFL /NDL /NJH /NJS >nul
copy "%APP_DIR%\package.json"      "%APP_DIR%\app\" >nul
copy "%APP_DIR%\next.config.ts"    "%APP_DIR%\app\" >nul 2>&1
copy "%APP_DIR%\next.config.js"    "%APP_DIR%\app\" >nul 2>&1
copy "%APP_DIR%\tsconfig.json"     "%APP_DIR%\app\" >nul
copy "%APP_DIR%\postcss.config.mjs" "%APP_DIR%\app\" >nul 2>&1
copy "%APP_DIR%\tailwind.config.js" "%APP_DIR%\app\" >nul 2>&1

echo  [완료] app 폴더 구성 완료

:: NSIS로 EXE 빌드
%NSIS% "%APP_DIR%\installer.nsi"

if %errorLevel% equ 0 (
    echo.
    echo  ╔══════════════════════════════════════════╗
    echo  ║  빌드 완료! 보안점검_설치.exe 생성됨       ║
    echo  ╚══════════════════════════════════════════╝
    echo.
    echo  파일 위치: %APP_DIR%\보안점검_설치.exe
) else (
    echo  [오류] 빌드 실패. 오류 내용을 확인하세요.
)

pause
