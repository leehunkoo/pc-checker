import { NextResponse } from "next/server"
import { execSync } from "child_process"

function runCmd(cmd: string): string {
  try { return execSync(cmd, { encoding: "buffer", shell: "cmd.exe", timeout: 6000 }).toString("utf8").trim() } catch { return "" }
}
function runPS(cmd: string): string {
  try { return execSync(`powershell -NoProfile -Command "${cmd}"`, { encoding: "utf8", shell: "cmd.exe", timeout: 6000 }).trim() } catch { return "" }
}

export async function GET() {
  if (process.platform !== "win32") return NextResponse.json({ status: "manual", detail: "Windows 전용", link: "" })

  const username = runPS("$env:USERNAME")
  const raw = runCmd(`net user ${username}`)

  // 마지막 암호 변경일 파싱
  let passwordAgeDays = 9999
  let passwordDateStr = ""
  for (const line of raw.split(/\r?\n/)) {
    if (line.includes("암호 설정") || line.includes("Password last set") || line.includes("암호를 마지막")) {
      // 날짜 패턴: 2026-02-26 or 2026/02/26
      const m = line.match(/(\d{4}[-\/]\d{2}[-\/]\d{2})/)
      if (m) {
        passwordDateStr = m[1]
        const d = new Date(passwordDateStr)
        if (!isNaN(d.getTime())) {
          passwordAgeDays = Math.floor((Date.now() - d.getTime()) / 86400000)
        }
      }
    }
  }

  // 30일 이내 변경 여부
  if (passwordAgeDays <= 30) {
    return NextResponse.json({
      status: "pass",
      detail: `비밀번호 ${passwordAgeDays}일 전 변경 — 양호`,
      passwordAgeDays,
      link: "ms-settings:signinoptions"
    })
  } else if (passwordAgeDays <= 90) {
    return NextResponse.json({
      status: "warn",
      detail: `비밀번호 ${passwordAgeDays}일 전 변경 — 30일 주기 변경 권장`,
      passwordAgeDays,
      link: "ms-settings:signinoptions"
    })
  } else if (passwordAgeDays < 9999) {
    return NextResponse.json({
      status: "fail",
      detail: `비밀번호 ${passwordAgeDays}일 전 변경 — 즉시 변경 필요`,
      passwordAgeDays,
      link: "ms-settings:signinoptions"
    })
  }

  // 날짜 확인 불가 시 정책으로 판단
  const policyRaw = runCmd("net accounts")
  let maxAge = 0
  for (const line of policyRaw.split(/\r?\n/)) {
    const m = line.match(/(\d+)/)
    if ((line.includes("Maximum") || line.includes("최대")) && m) { maxAge = parseInt(m[1]); break }
  }

  if (maxAge === 0 || maxAge >= 999) return NextResponse.json({ status: "warn", detail: "비밀번호 만료 정책 없음 — 30일 주기 변경 권장", link: "ms-settings:signinoptions" })
  if (maxAge <= 30) return NextResponse.json({ status: "pass", detail: `비밀번호 최대 사용기간: ${maxAge}일`, link: "ms-settings:signinoptions" })
  return NextResponse.json({ status: "warn", detail: `비밀번호 최대 사용기간: ${maxAge}일 — 30일 이내 권장`, link: "ms-settings:signinoptions" })
}