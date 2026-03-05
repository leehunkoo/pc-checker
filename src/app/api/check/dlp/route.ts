import { NextResponse } from "next/server"
import { execSync } from "child_process"

function runPS(cmd: string): string {
  try { return execSync(`powershell -NoProfile -Command "${cmd}"`, { encoding: "utf8", shell: "cmd.exe", timeout: 6000 }).trim() } catch { return "" }
}

export async function GET() {
  if (process.platform !== "win32") {
    return NextResponse.json({ status:"manual", detail:"Windows 전용", installed:false })
  }

  // Officekeeper DLP 설치 확인
  const dlpNames = ["Officekeeper", "OfficeKeeper", "오피스키퍼", "DLP", "Symantec DLP", "Forcepoint DLP", "McAfee DLP"]
  
  let installed = false
  let dlpName = ""

  for (const name of dlpNames) {
    const res = runPS(`Get-ItemProperty 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*' -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -like '*${name}*' } | Select-Object -First 1 -ExpandProperty DisplayName`)
    if (res && res.trim()) { installed = true; dlpName = res.trim(); break }
  }

  // 서비스 확인 (설치 확인이 안 됐을 때)
  if (!installed) {
    const svcNames = ["OKService", "OfficeKeeper", "OfficekeeperAgent"]
    for (const svc of svcNames) {
      const res = runPS(`(Get-Service -Name '${svc}' -ErrorAction SilentlyContinue).Status`)
      if (res && (res.includes("Running") || res.includes("Stopped"))) {
        installed = true; dlpName = "Officekeeper DLP"; break
      }
    }
  }

  if (installed) {
    return NextResponse.json({ status:"pass", detail:`${dlpName} 설치됨 — 인터넷 사용 통제 적용 중`, installed:true })
  }
  return NextResponse.json({ status:"manual", detail:"DLP 미설치 — 인터넷 사용 수동 확인 필요", installed:false })
}
