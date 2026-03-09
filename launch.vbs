Dim objShell, objFSO, installDir

Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' launch.vbs 자신의 위치에서 설치 경로 자동 감지
installDir = objFSO.GetParentFolderName(WScript.ScriptFullName)

Dim nodeExe, npmCli, appPath
nodeExe = installDir & "\runtime\node.exe"
npmCli  = installDir & "\runtime\node_modules\npm\bin\npm-cli.js"
appPath = installDir & "\app"

' 파일 존재 확인
If Not objFSO.FileExists(nodeExe) Then
  MsgBox "Node.js 런타임을 찾을 수 없습니다." & vbCrLf & nodeExe, 16, "오류"
  WScript.Quit
End If

If Not objFSO.FolderExists(appPath) Then
  MsgBox "앱 폴더를 찾을 수 없습니다." & vbCrLf & appPath, 16, "오류"
  WScript.Quit
End If

' node 실행 (창 없음)
objShell.CurrentDirectory = appPath
objShell.Run Chr(34) & nodeExe & Chr(34) & " " & Chr(34) & npmCli & Chr(34) & " run dev -- -p 3000", 0, False

' 서버 준비될 때까지 폴링 대기 (최대 60초)
Dim xmlHttp, ready, waited
ready = False
waited = 0
Do While Not ready And waited < 60
    WScript.Sleep 2000
    waited = waited + 2
    On Error Resume Next
    Set xmlHttp = CreateObject("Msxml2.XMLHTTP.6.0")
    xmlHttp.Open "GET", "http://localhost:3000", False
    xmlHttp.Send
    If Err.Number = 0 Then ready = True
    On Error GoTo 0
Loop
objShell.Run "http://localhost:3000"