import { NextResponse } from "next/server"
import { execSync } from "child_process"
function runPS(cmd: string): string { try { return execSync(`powershell -NoProfile -Command "${cmd}"`, { encoding: "utf8", shell: "cmd.exe", timeout: 8000 }).trim() } catch { return "" } }
function runCmd(cmd: string): string { try { return execSync(cmd, { encoding: "buffer", shell: "cmd.exe", timeout: 6000 }).toString("utf8").trim() } catch { return "" } }
export async function GET() {
  if (process.platform !== "win32") return NextResponse.json({ status: "manual", detail: "Windows 전용", installed: false })
  const okReg = runPS("Get-ItemProperty 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*' -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -like '*OfficeKeeper*' -or $_.DisplayName -like '*오피스키퍼*' } | Select-Object -First 1 -ExpandProperty DisplayName")
  const okSvc = runCmd("sc query OfficeKeeper") || runCmd("sc query OKAgent")
  const okRunning = okSvc.includes("RUNNING")
  const okProcess = runPS("Get-Process -Name 'OKAgent','OfficeKeeper' -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Name")
  const installed = !!okReg || okRunning || !!okProcess
  if (installed) return NextResponse.json({ status: "pass", detail: "OfficeKeeper DLP 설치 및 실행 중", installed: true, name: okReg || "OfficeKeeper" })
  return NextResponse.json({ status: "fail", detail: "DLP(OfficeKeeper) 미설치 — 보안팀 문의", installed: false })
}