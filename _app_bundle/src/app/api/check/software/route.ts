import { NextResponse } from "next/server"

const TRUSTED = [
  "microsoft", "google", "apple", "adobe", "oracle", "intel", "amd", "nvidia",
  "samsung", "lg", "hp", "dell", "lenovo", "asus", "mozilla", "slack", "zoom",
  "kakao", "naver", "hancom", "ahnlab", "daum", "windows", "qualcomm",
  "realtek", "broadcom", "synaptics", "mcafee", "symantec", "kaspersky",
  "teamviewer", "anydesk", "7-zip", "winrar", "notepad", "vscode",
  "한컴", "카카오", "네이버", "다음", "정부", "행정전자", "대한민국",
]

function isTrusted(pub: string) {
  if (!pub || pub.trim() === "") return false
  const l = pub.toLowerCase()
  return TRUSTED.some(t => l.includes(t.toLowerCase()))
}

export async function GET() {
  try {
    if (process.platform !== "win32") {
      return NextResponse.json({ status: "manual", detail: "Windows 전용", suspicious: [] })
    }

    const { execFileSync } = require("child_process")
    const fs = require("fs")
    const os = require("os")
    const path = require("path")

    const psScript = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$result = @()
$paths = @(
  'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
  'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
  'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*'
)
foreach ($p in $paths) {
  if (Test-Path $p) {
    $items = Get-ItemProperty $p -ErrorAction SilentlyContinue |
      Where-Object { $_.DisplayName -and $_.DisplayName.Trim() -ne '' } |
      Select-Object DisplayName, Publisher, DisplayVersion, InstallDate
    $result += $items
  }
}
$result | Sort-Object DisplayName -Unique | ConvertTo-Json -Depth 2
`
    const scriptPath = path.join(os.tmpdir(), "sw_check.ps1")
    fs.writeFileSync(scriptPath, `\uFEFF${psScript}`, "utf8")

    let raw = ""
    try {
      raw = execFileSync("powershell", [
        "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath
      ], { encoding: "utf8", timeout: 20000 })
    } finally {
      try { fs.unlinkSync(scriptPath) } catch {}
    }

    let apps: Array<{ DisplayName: string; Publisher: string; DisplayVersion: string; InstallDate: string }> = []
    try {
      const parsed = JSON.parse(raw.trim())
      apps = Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      return NextResponse.json({ status: "manual", detail: "프로그램 목록 파싱 실패 — 수동 확인", suspicious: [] })
    }

    const suspicious = apps
      .filter(a => !isTrusted(a.Publisher || ""))
      .map(a => ({
        name: a.DisplayName || "이름없음",
        publisher: a.Publisher || "알수없음",
        version: a.DisplayVersion || "-",
        installDate: a.InstallDate || "-",
      }))
      .slice(0, 60)

    const status = suspicious.length === 0 ? "pass" : suspicious.length <= 5 ? "warn" : "fail"
    const detail = suspicious.length === 0
      ? "출처 불명 소프트웨어 없음 — 양호"
      : `출처 불명 소프트웨어 ${suspicious.length}개 발견`

    return NextResponse.json({ status, detail, suspicious, total: apps.length })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ status: "manual", detail: `조회 실패 (${msg.slice(0, 80)})`, suspicious: [] })
  }
}

export async function DELETE(req: Request) {
  try {
    const { execSync } = require("child_process")
    execSync("start appwiz.cpl", { shell: "cmd.exe" })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false })
  }
}