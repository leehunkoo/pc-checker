import { NextResponse } from "next/server"
import { execSync } from "child_process"
function runPS(cmd: string): string { try { return execSync(`powershell -NoProfile -Command "${cmd}"`, { encoding: "utf8", shell: "cmd.exe", timeout: 8000 }).trim() } catch { return "" } }
function runCmd(cmd: string): string { try { return execSync(cmd, { encoding: "buffer", shell: "cmd.exe", timeout: 6000 }).toString("utf8").trim() } catch { return "" } }
export async function GET() {
  if (process.platform !== "win32") return NextResponse.json({ status: "manual", detail: "Windows 전용", link: "ms-settings:windowsdefender" })
  const v3Reg = runPS("Get-ItemProperty 'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*' -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -like '*V3*' -or $_.DisplayName -like '*AhnLab*' } | Select-Object -First 1 -ExpandProperty DisplayName")
  if (v3Reg) return NextResponse.json({ status: "pass", detail: "V3 방화벽 활성화 확인됨", v3: true, link: "" })
  const domainOn  = runPS("(Get-NetFirewallProfile -Profile Domain).Enabled").trim()  === "True"
  const privateOn = runPS("(Get-NetFirewallProfile -Profile Private).Enabled").trim() === "True"
  const publicOn  = runPS("(Get-NetFirewallProfile -Profile Public).Enabled").trim()  === "True"
  const winFWOn = domainOn || privateOn || publicOn
  if (domainOn && privateOn && publicOn) return NextResponse.json({ status: "pass", detail: "Windows 방화벽 전체 프로필 활성화됨", v3: false, link: "ms-settings:windowsdefender" })
  if (winFWOn) { const off = [!domainOn&&"도메인",!privateOn&&"개인",!publicOn&&"공용"].filter(Boolean).join(", "); return NextResponse.json({ status: "warn", detail: `방화벽 일부 꺼짐 — ${off} 프로필`, v3: false, link: "ms-settings:windowsdefender" }) }
  return NextResponse.json({ status: "fail", detail: "방화벽 꺼짐 — 즉시 활성화 필요", v3: false, link: "ms-settings:windowsdefender" })
}