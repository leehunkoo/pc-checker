Unicode True
SetCompressor /SOLID lzma

!define APP_NAME "PC 보안 자가점검"
!define APP_VERSION "1.0"
!define PUBLISHER "보안팀"

Name "${APP_NAME} ${APP_VERSION}"
OutFile "보안점검_설치.exe"
InstallDir "$DESKTOP\보안점검"
RequestExecutionLevel user
ShowInstDetails show

!include "MUI2.nsh"

!define MUI_ABORTWARNING
!define MUI_ICON "security_icon.ico"
!define MUI_UNICON "security_icon.ico"
!define MUI_WELCOMEPAGE_TITLE "PC 보안 자가점검 시스템 설치"
!define MUI_WELCOMEPAGE_TEXT "PC 보안 자가점검 시스템을 설치합니다.$\r$\n$\r$\n설치 후 바탕화면의 PC 보안점검 아이콘을 실행하세요."
!define MUI_FINISHPAGE_TITLE "설치 완료!"
!define MUI_FINISHPAGE_TEXT "바탕화면의 PC 보안점검 아이콘을 더블클릭하여 실행하세요."

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "Korean"

Section "Main" SecMain
  SetOutPath "$INSTDIR"
  File "launch.vbs"
  File "version.txt"
  File "security_icon.ico"

  SetOutPath "$INSTDIR\app"
  File /r "_app_bundle\*.*"

  SetOutPath "$INSTDIR\runtime"
  File /r "runtime\*.*"

  WriteRegStr HKCU "Software\${APP_NAME}" "InstallDir" "$INSTDIR"

  CreateShortcut "$DESKTOP\PC 보안점검.lnk" "wscript.exe" '"$INSTDIR\launch.vbs"' "$INSTDIR\security_icon.ico" 0

  CreateDirectory "$SMPROGRAMS\${APP_NAME}"
  CreateShortcut "$SMPROGRAMS\${APP_NAME}\PC 보안점검.lnk" "wscript.exe" '"$INSTDIR\launch.vbs"' "$INSTDIR\security_icon.ico" 0
  CreateShortcut "$SMPROGRAMS\${APP_NAME}\제거.lnk" "$INSTDIR\uninstall.exe"

  WriteUninstaller "$INSTDIR\uninstall.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayName" "${APP_NAME}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "UninstallString" '"$INSTDIR\uninstall.exe"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayVersion" "${APP_VERSION}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "Publisher" "${PUBLISHER}"
SectionEnd

Section "Uninstall"
  RMDir /r "$INSTDIR\app"
  RMDir /r "$INSTDIR\runtime"
  Delete "$INSTDIR\launch.vbs"
  Delete "$INSTDIR\version.txt"
  Delete "$INSTDIR\security_icon.ico"
  Delete "$INSTDIR\uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$DESKTOP\PC 보안점검.lnk"
  Delete "$SMPROGRAMS\${APP_NAME}\PC 보안점검.lnk"
  Delete "$SMPROGRAMS\${APP_NAME}\제거.lnk"
  RMDir "$SMPROGRAMS\${APP_NAME}"
  DeleteRegKey HKCU "Software\${APP_NAME}"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"
SectionEnd