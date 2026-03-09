$installDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodeExe    = "$installDir\runtime\node.exe"
$npmCli     = "$installDir\runtime\node_modules\npm\bin\npm-cli.js"
$appPath    = "$installDir\app"

if (-not (Test-Path $nodeExe)) {
    [System.Windows.Forms.MessageBox]::Show("node.exe를 찾을 수 없습니다: $nodeExe")
    exit
}
if (-not (Test-Path $appPath)) {
    [System.Windows.Forms.MessageBox]::Show("앱 폴더를 찾을 수 없습니다: $appPath")
    exit
}

# 사용 가능한 포트 찾기 (3000~3010)
$port = 3000
for ($p = 3000; $p -le 3010; $p++) {
    $used = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
    if (-not $used) { $port = $p; break }
}

Set-Location $appPath
$proc = Start-Process -FilePath $nodeExe -ArgumentList "$npmCli run dev -- -p $port" -WorkingDirectory $appPath -PassThru -NoNewWindow -WindowStyle Hidden

# 포트 열릴 때까지 대기
$waited = 0
while ($waited -lt 60) {
    Start-Sleep 2; $waited += 2
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("127.0.0.1", $port)
        $tcp.Close()
        Start-Process "http://localhost:$port"
        break
    } catch {}
}

$proc.WaitForExit()

# 종료 시 포트 정리
Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue