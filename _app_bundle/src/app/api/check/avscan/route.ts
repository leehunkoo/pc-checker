import { NextResponse } from "next/server"
import { execSync } from "child_process"
function runPS(cmd: string): string { try { return execSync(`powershell -NoProfile -Command "${cmd}"`, { encoding: "utf8", shell: "cmd.exe", timeout: 8000 }).trim() } catch { return "" } }
export async function GET() {
  if (process.platform !== "win32") return NextResponse.json({ status: "manual", detail: "Windows 전용", link: "" })
  const v3Reg = runPS("Get-ItemProperty 'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*' -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -like '*V3*' -or $_.DisplayName -like '*AhnLab*' } | Select-Object -First 1 -ExpandProperty DisplayName")
  if (v3Reg) return NextResponse.json({ status: "pass", detail: "V3 정기 검사 스케줄 운영 중", link: "" })
  try {
    const raw = runPS("Get-MpComputerStatus | Select-Object QuickScanAge,FullScanAge | ConvertTo-Json")
    if (raw) { const data = JSON.parse(raw); const minAge = Math.min(data.QuickScanAge ?? 9999, data.FullScanAge ?? 9999)
      if (minAge <= 7) return NextResponse.json({ status: "pass", detail: `최근 검사: ${minAge}일 전`, link: "windowsdefender://threat/" })
      if (minAge <= 30) return NextResponse.json({ status: "warn", detail: `마지막 검사: ${minAge}일 전 — 주 1회 권장`, link: "windowsdefender://threat/" })
      return NextResponse.json({ status: "fail", detail: `마지막 검사: ${minAge}일 전 — 즉시 검사 필요`, link: "windowsdefender://threat/" })
    }
  } catch {}
  return NextResponse.json({ status: "manual", detail: "검사 이력 확인 불가 — 수동 확인", link: "windowsdefender://threat/" })
}