import { NextResponse } from "next/server"
import { execSync } from "child_process"

function runPS(cmd: string): string {
  try { return execSync(`powershell -NoProfile -Command "${cmd}"`, { encoding: "utf8", shell: "cmd.exe", timeout: 8000 }).trim() } catch { return "" }
}
function runCmd(cmd: string): string {
  try { return execSync(cmd, { encoding: "buffer", shell: "cmd.exe", timeout: 6000 }).toString("utf8").trim() } catch { return "" }
}

const SECURITY_AGENTS = [
  // DLP
  { name: "OfficeKeeper", type: "DLP", keys: ["OfficeKeeper", "오피스키퍼", "JiranSoft"], svc: ["OfficeKeeper", "OKAgent"] },
  { name: "Secure KeyStroke", type: "보안에이전트", keys: ["Secure KeyStroke", "SecureKeyStroke"], svc: ["SecureKeyStroke"] },
  { name: "Saferzone", type: "DLP", keys: ["Saferzone", "SaferZone"], svc: ["SaferzoneAgent"] },
  { name: "MyDLP", type: "DLP", keys: ["MyDLP"], svc: ["MyDLP"] },
  { name: "Endpoint Protector", type: "DLP", keys: ["Endpoint Protector", "CoSoSys"], svc: ["EPPService"] },
  // NAC
  { name: "KSign NAC", type: "NAC", keys: ["KCaseAgent", "KSign"], svc: ["KCaseAgent"] },
  { name: "Genian NAC", type: "NAC", keys: ["Genian", "GnAgent"], svc: ["GnAgent"] },
  { name: "FortiNAC", type: "NAC", keys: ["FortiNAC", "FortiClient"], svc: ["FortiNAC", "FortiClient"] },
  { name: "Cisco ISE", type: "NAC", keys: ["Cisco NAC", "Cisco ISE"], svc: ["CiscoNAC"] },
  // EDR
  { name: "CrowdStrike", type: "EDR", keys: ["CrowdStrike", "Falcon"], svc: ["CSFalconService"] },
  { name: "SentinelOne", type: "EDR", keys: ["SentinelOne", "SentinelAgent"], svc: ["SentinelAgent"] },
  { name: "Carbon Black", type: "EDR", keys: ["Carbon Black", "VMware Carbon"], svc: ["CarbonBlack"] },
  { name: "Microsoft Defender for Endpoint", type: "EDR", keys: ["Microsoft Defender for Endpoint"], svc: ["Sense"] },
  { name: "AhnLab EDR", type: "EDR", keys: ["AhnLab EDR", "V3 EDR"], svc: ["AhnLabEDR"] },
  // XDR
  { name: "Palo Alto XDR", type: "XDR", keys: ["Cortex XDR", "Palo Alto"], svc: ["CortexXDR"] },
  { name: "Microsoft XDR", type: "XDR", keys: ["Microsoft 365 Defender"], svc: [] },
  // 보안 에이전트
  { name: "nProtect", type: "보안에이전트", keys: ["nProtect"], svc: ["nProtect"] },
  { name: "AhnLab V3", type: "백신/통합보안", keys: ["AhnLab V3", "V3 Internet Security"], svc: ["V3Service", "AhnLab_V3Service"] },
  { name: "ALYac", type: "백신", keys: ["ALYac", "알약"], svc: ["ALYacService"] },
]

export async function GET() {
  if (process.platform !== "win32") return NextResponse.json({ status: "manual", detail: "Windows 전용", installed: false, agents: [] })

  // 설치된 프로그램 목록
  const regRaw = runPS("Get-ItemProperty 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*' -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName } | Select-Object DisplayName,Publisher | ConvertTo-Json -Depth 2")

  let installedApps: Array<{DisplayName:string, Publisher:string}> = []
  try { const p = JSON.parse(regRaw); installedApps = Array.isArray(p) ? p : [p] } catch {}

  const foundAgents: Array<{name:string, type:string, running:boolean}> = []

  for (const agent of SECURITY_AGENTS) {
    // 레지스트리에서 설치 확인
    const isInstalled = installedApps.some(a =>
      agent.keys.some(k => (a.DisplayName || "").toLowerCase().includes(k.toLowerCase()) || (a.Publisher || "").toLowerCase().includes(k.toLowerCase()))
    )

    // 서비스 실행 확인
    let isRunning = false
    for (const svc of agent.svc) {
      const svcRaw = runCmd(`sc query "${svc}"`)
      if (svcRaw.includes("RUNNING")) { isRunning = true; break }
    }

    if (isInstalled || isRunning) {
      foundAgents.push({ name: agent.name, type: agent.type, running: isRunning })
    }
  }

  // DLP 계열만 필터 (주요 판단 기준)
  const dlpAgents = foundAgents.filter(a => a.type === "DLP")
  const nacAgents = foundAgents.filter(a => a.type === "NAC")
  const edrAgents = foundAgents.filter(a => a.type === "EDR" || a.type === "XDR")

  if (foundAgents.length === 0) {
    return NextResponse.json({ status: "fail", detail: "보안 에이전트 미설치 — 보안팀 문의", installed: false, agents: [] })
  }

  const agentSummary = foundAgents.map(a => `${a.name}(${a.type})`).join(", ")
  const allRunning = foundAgents.every(a => a.running)

  return NextResponse.json({
    status: allRunning ? "pass" : "warn",
    detail: `보안 에이전트 ${foundAgents.length}개 감지: ${agentSummary}`,
    installed: true,
    agents: foundAgents,
    dlp: dlpAgents,
    nac: nacAgents,
    edr: edrAgents,
  })
}