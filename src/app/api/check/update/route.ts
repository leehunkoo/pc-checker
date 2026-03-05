import { NextResponse } from "next/server"
import { execSync } from "child_process"

export async function GET() {
  try {
    if (process.platform !== "win32") {
      return NextResponse.json({ status: "manual", detail: "Windows 전용", link: "ms-settings:windowsupdate" })
    }

    let autoUpdate = false
    let lastUpdateDays = 9999
    let lastUpdateStr = ""

    // 방법1: Windows Update 정책 레지스트리 (그룹정책)
    try {
      const reg = execSync(
        `reg query "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\\AU" /v NoAutoUpdate`,
        { encoding: "buffer", shell: "cmd.exe" }
      ).toString("utf8")
      const m = reg.match(/NoAutoUpdate\s+REG_DWORD\s+(0x[\da-fA-F]+)/i)
      if (m) autoUpdate = parseInt(m[1], 16) === 0
    } catch {}

    // 방법2: 일반 AUOptions
    if (!autoUpdate) {
      try {
        const reg2 = execSync(
          `reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\WindowsUpdate\\Auto Update" /v AUOptions`,
          { encoding: "buffer", shell: "cmd.exe" }
        ).toString("utf8")
        const m = reg2.match(/AUOptions\s+REG_DWORD\s+(0x[\da-fA-F]+)/i)
        if (m) autoUpdate = parseInt(m[1], 16) >= 3
      } catch {}
    }

    // 방법3: Windows Update 서비스 실행 여부로 판단
    if (!autoUpdate) {
      try {
        const svc = execSync(`sc query wuauserv`, { encoding: "buffer", shell: "cmd.exe" }).toString("utf8")
        autoUpdate = svc.includes("RUNNING")
      } catch {}
    }

    // 마지막 업데이트 날짜
    try {
      const raw = execSync(
        `powershell -NoProfile -Command "(Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 1).InstalledOn.ToString('yyyy-MM-dd')"`,
        { encoding: "utf8", shell: "cmd.exe" }
      ).trim()
      if (raw && raw.match(/^\d{4}-\d{2}-\d{2}$/)) {
        lastUpdateStr = raw
        lastUpdateDays = Math.floor((Date.now() - new Date(raw).getTime()) / 86400000)
      }
    } catch {}

    const updateInfo = lastUpdateStr ? `마지막 업데이트 ${lastUpdateDays}일 전` : "업데이트 날짜 조회 불가"

    let status: string, detail: string
    if (autoUpdate && lastUpdateDays <= 30) {
      status = "pass"; detail = `자동 업데이트 활성 / ${updateInfo}`
    } else if (autoUpdate) {
      status = "warn"; detail = `자동 업데이트 활성 / ${updateInfo}`
    } else {
      status = "fail"; detail = `자동 업데이트 비활성 — 즉시 설정 필요 / ${updateInfo}`
    }

    return NextResponse.json({ status, detail, autoUpdate, lastUpdateDays, link: "ms-settings:windowsupdate" })
  } catch {
    return NextResponse.json({ status: "warn", detail: "자동 업데이트 상태 조회 실패 — 직접 확인 필요", link: "ms-settings:windowsupdate" })
  }
}
