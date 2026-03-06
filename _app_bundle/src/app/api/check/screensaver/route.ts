import { NextResponse } from "next/server"
import { execSync } from "child_process"
function runCmd(cmd: string): string { try { return execSync(cmd, { encoding: "buffer", shell: "cmd.exe", timeout: 6000 }).toString("utf8").trim() } catch { return "" } }
export async function GET() {
  if (process.platform !== "win32") return NextResponse.json({ status: "manual", detail: "Windows 전용", link: "" })
  const activeReg = runCmd(`reg query "HKCU\\Control Panel\\Desktop" /v ScreenSaveActive`)
  const timeoutReg = runCmd(`reg query "HKCU\\Control Panel\\Desktop" /v ScreenSaveTimeOut`)
  const lockReg = runCmd(`reg query "HKCU\\Control Panel\\Desktop" /v ScreenSaverIsSecure`)
  const isActive = activeReg.includes("0x1") || activeReg.includes("REG_SZ    1")
  const lockOn = lockReg.includes("0x1") || lockReg.includes("REG_SZ    1")
  let timeoutSec = 0
  const m = timeoutReg.match(/ScreenSaveTimeOut\s+REG_SZ\s+(\d+)/i)
  if (m) timeoutSec = parseInt(m[1])
  const timeoutMin = Math.round(timeoutSec / 60)
  if (isActive && lockOn && timeoutMin <= 10) return NextResponse.json({ status: "pass", detail: `화면보호기 ${timeoutMin}분 — 잠금 활성`, link: "ms-settings:personalization-lockscreen" })
  if (isActive && timeoutMin <= 10) return NextResponse.json({ status: "warn", detail: "화면보호기 활성 — 잠금 설정 필요", link: "ms-settings:personalization-lockscreen" })
  if (isActive && timeoutMin > 10) return NextResponse.json({ status: "warn", detail: `화면보호기 ${timeoutMin}분 — 10분 이내 권장`, link: "ms-settings:personalization-lockscreen" })
  return NextResponse.json({ status: "fail", detail: "화면보호기 비활성 — 즉시 설정 필요", link: "ms-settings:personalization-lockscreen" })
}