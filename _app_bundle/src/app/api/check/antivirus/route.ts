import { NextResponse } from "next/server"
import { execSync } from "child_process"

function runPS(cmd: string): string {
  try { return execSync(`powershell -NoProfile -Command "${cmd}"`, { encoding: "utf8", shell: "cmd.exe", timeout: 8000 }).trim() } catch { return "" }
}
function runCmd(cmd: string): string {
  try { return execSync(cmd, { encoding: "buffer", shell: "cmd.exe", timeout: 8000 }).toString("utf8").trim() } catch { return "" }
}

export async function GET() {
  if (process.platform !== "win32") return NextResponse.json({ status:"manual", detail:"Windows 전용", avUpdated:false, realtimeEnabled:false, avDetail:"", realtimeDetail:"", link:"" })

  let v3Installed = false, v3ServiceRunning = false, v3RealtimeOn = false
  const v3Svc = runCmd("sc query V3Service") || runCmd("sc query AhnLab_V3Service") || runCmd("sc query V3LTZ64")
  v3ServiceRunning = v3Svc.includes("RUNNING")
  const v3Reg = runPS("Get-ItemProperty 'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*' -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -like '*V3*' -or $_.DisplayName -like '*AhnLab*' } | Select-Object -First 1 -ExpandProperty DisplayName")
  if (v3Reg) v3Installed = true
  const v3RT = runCmd(`reg query "HKLM\\SOFTWARE\\AhnLab\\V3IS90" /v RealTimeProtect`) || runCmd(`reg query "HKLM\\SOFTWARE\\WOW6432Node\\AhnLab\\V3IS90" /v RealTimeProtect`)
  if (v3RT.match(/RealTimeProtect\s+REG_DWORD\s+0x1/i)) v3RealtimeOn = true
  else if (v3ServiceRunning && v3Installed) v3RealtimeOn = true

  let defEnabled = false, defRealtime = false, defUpdated = false, defSigAge = 9999
  try {
    const defRaw = runPS("Get-MpComputerStatus | Select-Object AntivirusEnabled,RealTimeProtectionEnabled,AntivirusSignatureAge | ConvertTo-Json")
    if (defRaw) { const def = JSON.parse(defRaw); defEnabled = !!def.AntivirusEnabled; defRealtime = !!def.RealTimeProtectionEnabled; defSigAge = def.AntivirusSignatureAge ?? 9999; defUpdated = defSigAge <= 3 }
  } catch {}

  let scName = ""
  try {
    const scRaw = runPS("Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntivirusProduct | Select-Object displayName | ConvertTo-Json -Depth 2")
    if (scRaw && scRaw !== "null") { const avs = JSON.parse(scRaw); const avList = Array.isArray(avs) ? avs : [avs]; scName = avList.map((a: any) => a.displayName).join(", ") }
  } catch {}

  const useV3 = v3Installed || v3ServiceRunning
  const avName = useV3 ? (v3Reg || "AhnLab V3") : (scName || "Windows Defender")
  const avInstalled = useV3 || defEnabled || !!scName
  const realtimeEnabled = useV3 ? v3RealtimeOn : defRealtime
  const avUpdated = useV3 ? true : defUpdated
  const avDetail = useV3 ? `${avName} 설치됨` : (defEnabled ? `Windows Defender 활성 (정의: ${defSigAge}일 전)` : "백신 없음 — 즉시 설치 필요")
  const realtimeDetail = useV3 ? (v3RealtimeOn ? `${avName} 실시간 감시 활성` : `${avName} 실시간 감시 꺼짐`) : (defRealtime ? "실시간 보호 활성" : "실시간 보호 꺼짐")

  return NextResponse.json({ status: avInstalled ? "pass" : "fail", detail: avInstalled ? `${avName} 설치됨` : "백신 없음 — 즉시 설치 필요", avName, avInstalled, avUpdated, avDetail, realtimeEnabled, realtimeDetail, useV3, defSigAge, link: useV3 ? "" : "windowsdefender:" })
}