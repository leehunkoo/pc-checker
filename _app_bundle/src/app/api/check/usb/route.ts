import { NextResponse } from "next/server"
import { execSync } from "child_process"
function runCmd(cmd: string): string { try { return execSync(cmd, { encoding: "buffer", shell: "cmd.exe", timeout: 6000 }).toString("utf8").trim() } catch { return "" } }
export async function GET() {
  if (process.platform !== "win32") return NextResponse.json({ status: "manual", detail: "Windows 전용", link: "ms-settings:autoplay" })
  const autoRunReg = runCmd(`reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\AutoplayHandlers" /v DisableAutoplay`)
  const autoRunGlobal = runCmd(`reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer" /v NoDriveTypeAutoRun`)
  const autoplayDisabled = autoRunReg.includes("0x1")
  const globalDisabled = !!(autoRunGlobal.match(/NoDriveTypeAutoRun\s+REG_DWORD\s+0xff/i) || autoRunGlobal.match(/NoDriveTypeAutoRun\s+REG_DWORD\s+0x91/i))
  if (autoplayDisabled || globalDisabled) return NextResponse.json({ status: "pass", detail: "이동식 미디어 자동실행 비활성화됨", link: "ms-settings:autoplay" })
  return NextResponse.json({ status: "warn", detail: "이동식 미디어 자동실행 활성화됨 — 비활성화 권장", link: "ms-settings:autoplay" })
}