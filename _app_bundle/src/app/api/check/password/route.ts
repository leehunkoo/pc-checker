import { NextResponse } from "next/server"
import { execSync } from "child_process"
function runCmd(cmd: string): string { try { return execSync(cmd, { encoding: "buffer", shell: "cmd.exe", timeout: 6000 }).toString("utf8").trim() } catch { return "" } }
export async function GET() {
  if (process.platform !== "win32") return NextResponse.json({ status: "manual", detail: "Windows 전용", link: "" })
  const raw = runCmd("net accounts")
  let maxAge = 0
  for (const line of raw.split(/\r?\n/)) { const m = line.match(/(\d+)/); if ((line.includes("Maximum") || line.includes("최대")) && m) { maxAge = parseInt(m[1]); break } }
  if (maxAge === 0 || maxAge >= 999) return NextResponse.json({ status: "warn", detail: "비밀번호 만료 정책 없음 — 30일 주기 변경 권장", link: "ms-settings:signinoptions" })
  if (maxAge <= 30) return NextResponse.json({ status: "pass", detail: `비밀번호 최대 사용기간: ${maxAge}일`, link: "ms-settings:signinoptions" })
  return NextResponse.json({ status: "warn", detail: `비밀번호 최대 사용기간: ${maxAge}일 — 30일 이내 권장`, link: "ms-settings:signinoptions" })
}