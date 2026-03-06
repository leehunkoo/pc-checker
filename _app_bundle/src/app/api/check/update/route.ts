import { NextResponse } from "next/server"
import { execSync } from "child_process"
function runPS(cmd: string): string { try { return execSync(`powershell -NoProfile -Command "${cmd}"`, { encoding: "utf8", shell: "cmd.exe", timeout: 8000 }).trim() } catch { return "" } }
export async function GET() {
  if (process.platform !== "win32") return NextResponse.json({ status: "manual", detail: "Windows 전용", link: "ms-settings:windowsupdate" })
  try {
    const raw = runPS("(New-Object -ComObject Microsoft.Update.AutoUpdate).Settings | Select-Object NotificationLevel | ConvertTo-Json")
    if (raw) { const data = JSON.parse(raw); const level = data.NotificationLevel ?? 0
      if (level >= 3) return NextResponse.json({ status: "pass", detail: "Windows 자동 업데이트 활성화됨", link: "ms-settings:windowsupdate" })
      if (level > 0) return NextResponse.json({ status: "warn", detail: "업데이트 알림만 설정됨 — 자동 설치 권장", link: "ms-settings:windowsupdate" })
      return NextResponse.json({ status: "fail", detail: "자동 업데이트 꺼짐 — 활성화 필요", link: "ms-settings:windowsupdate" })
    }
  } catch {}
  return NextResponse.json({ status: "manual", detail: "업데이트 설정 확인 불가 — 수동 확인", link: "ms-settings:windowsupdate" })
}