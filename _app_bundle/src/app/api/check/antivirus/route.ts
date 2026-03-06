import { NextResponse } from "next/server"
import { execSync } from "child_process"

function runPS(cmd: string): string {
  try { return execSync(`powershell -NoProfile -Command "${cmd}"`, { encoding: "utf8", shell: "cmd.exe", timeout: 8000 }).trim() } catch { return "" }
}
function runCmd(cmd: string): string {
  try { return execSync(cmd, { encoding: "buffer", shell: "cmd.exe", timeout: 8000 }).toString("utf8").trim() } catch { return "" }
}

function parseProductState(state: number) {
  // productState 비트 해석
  // 상위 2바이트: 제품 존재여부, 하위 2바이트: 실시간감시 상태
  // 0x1000 = 실시간감시 켜짐, 0x0000 = 꺼짐
  const rt = (state >> 12) & 0xF
  const realtimeOn = rt === 1
  return { realtimeOn }
}

export async function GET() {
  if (process.platform !== "win32") return NextResponse.json({ status:"manual", detail:"Windows 전용", avUpdated:false, realtimeEnabled:false, avDetail:"", realtimeDetail:"", link:"" })

  // SecurityCenter2로 모든 백신 확인 (가장 정확)
  let scProducts: Array<{displayName:string, productState:number}> = []
  try {
    const scRaw = runPS("Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntivirusProduct | Select-Object displayName,productState | ConvertTo-Json -Depth 2")
    if (scRaw && scRaw !== "null") {
      const parsed = JSON.parse(scRaw)
      scProducts = Array.isArray(parsed) ? parsed : [parsed]
    }
  } catch {}

  // V3 제품 찾기
  const v3Product = scProducts.find(p => p.displayName && (p.displayName.includes("AhnLab") || p.displayName.includes("V3")))
  // Defender 제외한 서드파티 백신
  const thirdParty = scProducts.find(p => p.displayName && !p.displayName.includes("Windows Defender") && !p.displayName.includes("Windows Security"))

  const mainProduct = v3Product || thirdParty
  
  if (mainProduct) {
    const { realtimeOn } = parseProductState(mainProduct.productState)
    const avName = mainProduct.displayName
    return NextResponse.json({
      status: "pass",
      detail: `${avName} 설치됨`,
      avName,
      avInstalled: true,
      avUpdated: true,
      avDetail: `${avName} 설치됨`,
      realtimeEnabled: realtimeOn,
      realtimeDetail: realtimeOn ? `${avName} 실시간 감시 활성` : `${avName} 실시간 감시 꺼짐 — 확인 필요`,
      useV3: !!v3Product,
      defSigAge: 0,
      link: v3Product ? "" : "windowsdefender:",
    })
  }

  // SecurityCenter2에 없으면 Defender 직접 확인
  let defEnabled = false, defRealtime = false, defSigAge = 9999
  try {
    const defRaw = runPS("Get-MpComputerStatus | Select-Object AntivirusEnabled,RealTimeProtectionEnabled,AntivirusSignatureAge | ConvertTo-Json")
    if (defRaw) {
      const def = JSON.parse(defRaw)
      defEnabled = !!def.AntivirusEnabled
      defRealtime = !!def.RealTimeProtectionEnabled
      defSigAge = def.AntivirusSignatureAge ?? 9999
    }
  } catch {}

  if (defEnabled || defRealtime) {
    return NextResponse.json({
      status: "pass",
      detail: `Windows Defender 활성 (정의: ${defSigAge}일 전)`,
      avName: "Windows Defender",
      avInstalled: true,
      avUpdated: defSigAge <= 3,
      avDetail: `Windows Defender 활성 (정의: ${defSigAge}일 전)`,
      realtimeEnabled: defRealtime,
      realtimeDetail: defRealtime ? "실시간 보호 활성" : "실시간 보호 꺼짐",
      useV3: false,
      defSigAge,
      link: "windowsdefender:",
    })
  }

  return NextResponse.json({
    status: "fail",
    detail: "백신 없음 — 즉시 설치 필요",
    avName: "",
    avInstalled: false,
    avUpdated: false,
    avDetail: "백신 없음",
    realtimeEnabled: false,
    realtimeDetail: "백신 미설치",
    useV3: false,
    defSigAge: 9999,
    link: "windowsdefender:",
  })
}