import { NextResponse } from "next/server"
import { execSync } from "child_process"

function runCmd(cmd: string): string {
  try { return execSync(cmd, { encoding: "buffer", shell: "cmd.exe", timeout: 6000 }).toString("utf8").trim() } catch { return "" }
}
function runPS(cmd: string): string {
  try { return execSync(`powershell -NoProfile -Command "${cmd}"`, { encoding: "utf8", shell: "cmd.exe", timeout: 6000 }).trim() } catch { return "" }
}

export async function GET() {
  if (process.platform !== "win32") {
    return NextResponse.json({ status:"manual", detail:"Windows 전용", link:"ms-settings:windowsdefender" })
  }

  // ── V3 방화벽 확인 ──────────────────────────────────────────────
  let v3FirewallOn = false
  let v3Installed = false

  const v3FW = runCmd(`reg query "HKLM\\SOFTWARE\\AhnLab\\V3IS90" /v FirewallEnable`) ||
               runCmd(`reg query "HKLM\\SOFTWARE\\WOW6432Node\\AhnLab\\V3IS90" /v FirewallEnable`)
  const v3Reg = runPS("Get-ItemProperty 'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*' -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -like '*V3*' -or $_.DisplayName -like '*AhnLab*' } | Select-Object -First 1 -ExpandProperty DisplayName")
  if (v3Reg) v3Installed = true
  if (v3FW.match(/FirewallEnable\s+REG_DWORD\s+0x1/i) || v3Installed) v3FirewallOn = true

  // ── Windows 방화벽 확인 ─────────────────────────────────────────
  const raw = runCmd("netsh advfirewall show allprofiles state")
  let domainOn = false, privateOn = false, publicOn = false
  let profile = ""
  for (const line of raw.split(/\r?\n/)) {
    if (line.includes("Domain")) profile = "domain"
    else if (line.includes("Private") || line.includes("개인")) profile = "private"
    else if (line.includes("Public") || line.includes("공용")) profile = "public"
    if (line.match(/State\s+ON/i) || line.match(/상태\s+ON/i)) {
      if (profile === "domain") domainOn = true
      if (profile === "private") privateOn = true
      if (profile === "public") publicOn = true
    }
  }
  const winFWOn = domainOn || privateOn || publicOn

  // ── 결과 ────────────────────────────────────────────────────────
  if (v3Installed && v3FirewallOn) {
    return NextResponse.json({ status:"pass", detail:"V3 방화벽 활성 — 양호", v3:true, link:"" })
  }
  if (v3Installed && !v3FirewallOn) {
    return NextResponse.json({ status:"warn", detail:"V3 설치됨 / V3 방화벽 비활성 확인 필요", v3:true, link:"" })
  }
  if (domainOn && privateOn && publicOn) {
    return NextResponse.json({ status:"pass", detail:"Windows 방화벽 전체 프로필 활성 — 양호", v3:false, link:"ms-settings:windowsdefender" })
  }
  if (winFWOn) {
    const off = [!domainOn&&"도메인",!privateOn&&"개인",!publicOn&&"공용"].filter(Boolean).join(", ")
    return NextResponse.json({ status:"warn", detail:`방화벽 일부 비활성: ${off} 프로필`, v3:false, link:"ms-settings:windowsdefender" })
  }
  return NextResponse.json({ status:"fail", detail:"방화벽 비활성화 — 즉시 활성화 필요", v3:false, link:"ms-settings:windowsdefender" })
}
