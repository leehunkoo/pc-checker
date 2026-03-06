import { NextResponse } from "next/server"
import { execSync } from "child_process"

function runCmd(cmd: string): string {
  try { return execSync(cmd, { encoding: "buffer", shell: "cmd.exe", timeout: 6000 }).toString("utf8").trim() } catch { return "" }
}

function getRegValue(raw: string, key: string): string {
  const m = raw.match(new RegExp(`${key}\\s+REG_\\w+\\s+(.+)`, "i"))
  return m ? m[1].trim() : ""
}

export async function GET() {
  if (process.platform !== "win32") return NextResponse.json({ status: "manual", detail: "Windows 전용", link: "" })

  const activeRaw  = runCmd(`reg query "HKCU\\Control Panel\\Desktop" /v ScreenSaveActive`)
  const timeoutRaw = runCmd(`reg query "HKCU\\Control Panel\\Desktop" /v ScreenSaveTimeOut`)
  const lockRaw    = runCmd(`reg query "HKCU\\Control Panel\\Desktop" /v ScreenSaverIsSecure`)

  const activeVal  = getRegValue(activeRaw,  "ScreenSaveActive")
  const timeoutVal = getRegValue(timeoutRaw, "ScreenSaveTimeOut")
  const lockVal    = getRegValue(lockRaw,    "ScreenSaverIsSecure")

  const isActive  = activeVal === "1" || activeVal === "0x1"
  const lockOn    = lockVal   === "1" || lockVal   === "0x1"
  const timeoutSec = parseInt(timeoutVal) || 0
  const timeoutMin = Math.round(timeoutSec / 60)

  if (isActive && lockOn && timeoutMin > 0 && timeoutMin <= 10) {
    return NextResponse.json({ status: "pass", detail: `화면보호기 ${timeoutMin}분 설정 — 잠금 활성`, link: "ms-settings:personalization-lockscreen" })
  }
  if (isActive && lockOn && timeoutMin > 10) {
    return NextResponse.json({ status: "warn", detail: `화면보호기 ${timeoutMin}분 설정 — 10분 이내 권장`, link: "ms-settings:personalization-lockscreen" })
  }
  if (isActive && !lockOn) {
    return NextResponse.json({ status: "warn", detail: `화면보호기 ${timeoutMin}분 설정 — 잠금 미설정`, link: "ms-settings:personalization-lockscreen" })
  }
  return NextResponse.json({ status: "fail", detail: "화면보호기 비활성 — 즉시 설정 필요", link: "ms-settings:personalization-lockscreen" })
}