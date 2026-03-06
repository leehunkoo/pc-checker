$installDir = "C:\SecurityCheck"
$nodeExe    = "$installDir\runtime\node.exe"
$npmCli     = "$installDir\runtime\node_modules\npm\bin\npm-cli.js"
$appPath    = "$installDir\app"

if (-not (Test-Path $nodeExe)) { exit }
if (-not (Test-Path $appPath))  { exit }

Set-Location $appPath

$proc = Start-Process -FilePath $nodeExe -ArgumentList "$npmCli run dev -- -p 3000" -WorkingDirectory $appPath -PassThru -NoNewWindow -WindowStyle Hidden

# 포트 열릴 때까지 대기 후 브라우저 오픈
$waited = 0
while ($waited -lt 60) {
    Start-Sleep 2; $waited += 2
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("127.0.0.1", 3000)
        $tcp.Close()
        Start-Process "http://localhost:3000"
        break
    } catch {}
}

$proc.WaitForExit()

# 종료 시 포트 정리
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue