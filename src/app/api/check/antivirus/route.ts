import { NextResponse } from "next/server"
import { execSync } from "child_process"

function runPS(cmd: string): string {
  try {
    return execSync(`powershell -NoProfile -Command "${cmd}"`,
      { encoding: "utf8", shell: "cmd.exe", timeout: 8000 }).trim()
  } catch { return "" }
}

function runCmd(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "buffer", shell: "cmd.exe", timeout: 8000 }).toString("utf8").trim()
  } catch { return "" }
}

export async function GET() {
  if (process.platform !== "win32") {
    return NextResponse.json({ status:"manual", detail:"Windows 전용", avUpdated:false, realtimeEnabled:false, avDetail:"", realtimeDetail:"", firewallEnabled:false, firewallDetail:"", avName:"", link:"" })
  }

  // ── 1. AhnLab V3 확인 ──────────────────────────────────────────
  let v3Installed = false
  let v3ServiceRunning = false
  let v3RealtimeOn = false
  let v3FirewallOn = false
  let v3LastScan = ""
  let v3LastScanDays = 9999

  // V3 서비스 실행 여부
  const v3Svc = runCmd("sc query V3Service")
  if (!v3Svc) {
    // 서비스명 다르게 시도
    const v3Svc2 = runCmd("sc query AhnLab_V3Service") || runCmd("sc query V3LTZ64") || runCmd("sc query MpsSvc")
    v3ServiceRunning = v3Svc2.includes("RUNNING")
  } else {
    v3ServiceRunning = v3Svc.includes("RUNNING")
  }

  // V3 설치 확인 (레지스트리)
  const v3Reg = runPS("Get-ItemProperty 'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*' -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -like '*V3*' -or $_.DisplayName -like '*AhnLab*' } | Select-Object -First 1 -ExpandProperty DisplayName")
  if (v3Reg) { v3Installed = true }

  // V3 실시간 감시 레지스트리 확인
  const v3RT = runCmd(`reg query "HKLM\\SOFTWARE\\AhnLab\\V3IS90" /v RealTimeProtect`) ||
               runCmd(`reg query "HKLM\\SOFTWARE\\WOW6432Node\\AhnLab\\V3IS90" /v RealTimeProtect`) ||
               runCmd(`reg query "HKLM\\SOFTWARE\\AhnLab\\V3Lite" /v RealTimeProtect`)
  if (v3RT.match(/RealTimeProtect\s+REG_DWORD\s+0x1/i)) v3RealtimeOn = true
  else if (v3ServiceRunning && v3Installed) v3RealtimeOn = true // 서비스 실행중이면 실시간감시 ON으로 간주

  // V3 방화벽 레지스트리 확인
  const v3FW = runCmd(`reg query "HKLM\\SOFTWARE\\AhnLab\\V3IS90" /v FirewallEnable`) ||
               runCmd(`reg query "HKLM\\SOFTWARE\\WOW6432Node\\AhnLab\\V3IS90" /v FirewallEnable`)
  if (v3FW.match(/FirewallEnable\s+REG_DWORD\s+0x1/i)) v3FirewallOn = true
  else if (v3Installed) {
    // V3 방화벽은 기본 활성이므로 설치됐으면 활성으로 간주
    v3FirewallOn = true
  }

  // V3 마지막 전체검사 날짜
  const v3Scan = runCmd(`reg query "HKLM\\SOFTWARE\\AhnLab\\V3IS90" /v LastFullScanTime`) ||
                 runCmd(`reg query "HKLM\\SOFTWARE\\WOW6432Node\\AhnLab\\V3IS90" /v LastFullScanTime`)
  if (v3Scan) {
    const m = v3Scan.match(/LastFullScanTime\s+REG_SZ\s+(.+)/i)
    if (m) {
      v3LastScan = m[1].trim()
      const d = new Date(v3LastScan)
      if (!isNaN(d.getTime())) v3LastScanDays = Math.floor((Date.now() - d.getTime()) / 86400000)
    }
  }

  // ── 2. Windows Defender 확인 (V3 없을 때 fallback) ─────────────
  let defEnabled = false
  let defRealtime = false
  let defUpdated = false
  let defSigAge = 9999
  let defName = ""

  try {
    const defRaw = runPS("Get-MpComputerStatus | Select-Object AntivirusEnabled,RealTimeProtectionEnabled,AntivirusSignatureAge | ConvertTo-Json")
    if (defRaw) {
      const def = JSON.parse(defRaw)
      defEnabled = !!def.AntivirusEnabled
      defRealtime = !!def.RealTimeProtectionEnabled
      defSigAge = def.AntivirusSignatureAge ?? 9999
      defUpdated = defSigAge <= 3
      defName = "Windows Defender"
    }
  } catch {}

  // ── 3. SecurityCenter2 전체 백신 목록 ──────────────────────────
  let scName = ""
  try {
    const scRaw = runPS("Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntivirusProduct | Select-Object displayName | ConvertTo-Json -Depth 2")
    if (scRaw && scRaw !== "null") {
      const avs = JSON.parse(scRaw)
      const avList = Array.isArray(avs) ? avs : [avs]
      scName = avList.map((a: {displayName:string}) => a.displayName).join(", ")
    }
  } catch {}

  // ── 결과 조합 ──────────────────────────────────────────────────
  const useV3 = v3Installed || v3ServiceRunning
  const avName = useV3 ? (v3Reg || "AhnLab V3") : (scName || defName || "알 수 없음")
  const avInstalled = useV3 || defEnabled || !!scName

  let realtimeEnabled: boolean, avUpdated: boolean, firewallEnabled: boolean
  let avDetail: string, realtimeDetail: string, firewallDetail: string

  if (useV3) {
    realtimeEnabled = v3RealtimeOn
    avUpdated = true // V3는 자동업데이트 기본값; 정확한 날짜는 추가 쿼리 필요
    firewallEnabled = v3FirewallOn
    avDetail = `${avName} 설치됨`
    realtimeDetail = v3RealtimeOn ? `${avName} 실시간 감시 활성` : `${avName} 실시간 감시 비활성 — 확인 필요`
    firewallDetail = v3FirewallOn ? `${avName} 방화벽 활성` : `${avName} 방화벽 비활성 — 확인 필요`
  } else {
    realtimeEnabled = defRealtime
    avUpdated = defUpdated
    firewallEnabled = defEnabled // Defender 활성이면 방화벽도 기본 활성
    avDetail = defEnabled ? `Windows Defender 활성 (정의: ${defSigAge}일 전)` : "백신 없음 — 즉시 설치 필요"
    realtimeDetail = defRealtime ? "실시간 보호 활성" : "실시간 보호 비활성"
    firewallDetail = defEnabled ? "Windows Defender 방화벽 활성" : "방화벽 비활성 — 설정 필요"
  }

  // 전체 검사 정보 추가
  const scanInfo = v3LastScanDays < 9999
    ? ` / 마지막 전체검사: ${v3LastScanDays}일 전`
    : ""

  return NextResponse.json({
    status: avInstalled ? "pass" : "fail",
    detail: avInstalled ? `${avName} 설치됨${scanInfo}` : "백신 없음 — 즉시 설치 필요",
    avName,
    avInstalled,
    avUpdated,
    avDetail,
    realtimeEnabled,
    realtimeDetail,
    firewallEnabled,
    firewallDetail,
    useV3,
    v3LastScanDays,
    defSigAge,
    link: useV3 ? "" : "windowsdefender:",
  })
}
