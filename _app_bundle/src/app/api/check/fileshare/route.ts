import { NextResponse } from "next/server"
import { execSync } from "child_process"
function runCmd(cmd: string): string { try { return execSync(cmd, { encoding: "buffer", shell: "cmd.exe", timeout: 6000 }).toString("utf8").trim() } catch { return "" } }
export async function GET() {
  if (process.platform !== "win32") return NextResponse.json({ status: "manual", detail: "Windows 전용", link: "" })
  const shares = runCmd("net share")
  const systemShares = ["C$", "ADMIN$", "IPC$", "PRINT$"]
  const userShares = shares.split(/\r?\n/).filter(l => {
    const parts = l.trim().split(/\s+/); const name = parts[0]
    return name && !systemShares.some(s => name.toUpperCase() === s) && !l.includes("Share name") && !l.includes("공유 이름") && !l.includes("---") && !l.includes("명령이") && !l.includes("성공")
  })
  if (userShares.length === 0) return NextResponse.json({ status: "pass", detail: "불필요한 파일 공유 없음", shares: [], link: "" })
  return NextResponse.json({ status: "fail", detail: `파일 공유 ${userShares.length}개 활성화됨 — 확인 필요`, shares: userShares, link: "ms-settings:network-status" })
}