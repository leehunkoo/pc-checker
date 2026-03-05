import { NextResponse } from "next/server"
import { execSync } from "child_process"

function runCmd(cmd: string): string {
  try { return execSync(cmd, { encoding: "buffer", shell: "cmd.exe", timeout: 8000 }).toString("utf8").trim() } catch { return "" }
}
function runPS(cmd: string): string {
  try { return execSync(`powershell -NoProfile -Command "${cmd}"`, { encoding: "utf8", shell: "cmd.exe", timeout: 8000 }).trim() } catch { return "" }
}

export async function GET() {
  if (process.platform !== "win32") {
    return NextResponse.json({ status:"manual", detail:"Windows 전용", link:"" })
  }

  // ── V3 마지막 전체검사 ──────────────────────────────────────────
  let v3Days = 9999
  const v3Keys = [
    `HKLM\\SOFTWARE\\AhnLab\\V3IS90`,
    `HKLM\\SOFTWARE\\WOW6432Node\\AhnLab\\V3IS90`,
    `HKLM\\SOFTWARE\\AhnLab\\V3Lite`,
  ]
  for (const key of v3Keys) {
    const raw = runCmd(`reg query "${key}" /v LastFullScanTime`)
    const m = raw.match(/LastFullScanTime\s+REG_SZ\s+(.+)/i)
    if (m) {
      const d = new Date(m[1].trim())
      if (!isNaN(d.getTime())) { v3Days = Math.floor((Date.now() - d.getTime()) / 86400000); break }
    }
  }

  // V3 검사 로그 폴더 확인 (대안)
  if (v3Days === 9999) {
    const logPath = runPS("if (Test-Path 'C:\\ProgramData\\AhnLab\\V3IS90\\Log') { (Get-ChildItem 'C:\\ProgramData\\AhnLab\\V3IS90\\Log' | Sort-Object LastWriteTime -Descending | Select-Object -First 1).LastWriteTime.ToString('yyyy-MM-dd') }")
    if (logPath && logPath.match(/\d{4}-\d{2}-\d{2}/)) {
      v3Days = Math.floor((Date.now() - new Date(logPath).getTime()) / 86400000)
    }
  }

  // ── Windows Defender 전체검사 ───────────────────────────────────
  let defFullDays = 9999
  let defQuickDays = 9999

  const fullRaw = runPS("Get-MpComputerStatus | Select-Object -ExpandProperty FullScanStartTime")
  if (fullRaw && !fullRaw.startsWith("0001")) {
    const d = new Date(fullRaw)
    if (!isNaN(d.getTime())) defFullDays = Math.floor((Date.now() - d.getTime()) / 86400000)
  }
  const quickRaw = runPS("Get-MpComputerStatus | Select-Object -ExpandProperty QuickScanStartTime")
  if (quickRaw && !quickRaw.startsWith("0001")) {
    const d = new Date(quickRaw)
    if (!isNaN(d.getTime())) defQuickDays = Math.floor((Date.now() - d.getTime()) / 86400000)
  }

  // ── 결과 판정 ──────────────────────────────────────────────────
  const useV3 = v3Days < 9999
  const bestDays = useV3 ? v3Days : defFullDays

  if (bestDays === 9999 && defQuickDays === 9999) {
    return NextResponse.json({ status:"manual", detail:"검사 이력 조회 실패 — 수동 확인 필요", link:"windowsdefender://" })
  }

  let status: string, detail: string
  if (bestDays <= 7) {
    status = "pass"
    detail = useV3 ? `V3 전체검사 ${v3Days}일 전 실시 — 양호` : `전체검사 ${bestDays}일 전 실시 — 양호`
  } else if (bestDays <= 30) {
    status = "warn"
    detail = useV3 ? `V3 전체검사 ${v3Days}일 전 — 주 1회 이상 권장` : `전체검사 ${bestDays}일 전 — 주 1회 이상 권장`
  } else {
    status = "fail"
    detail = bestDays === 9999
      ? `전체검사 기록 없음 / 빠른검사 ${defQuickDays}일 전`
      : `${useV3 ? "V3" : ""} 전체검사 ${bestDays}일 전 — 즉시 실시 필요`
  }

  return NextResponse.json({ status, detail, v3Days, defFullDays, defQuickDays, link:"windowsdefender://threat/" })
}
