import { NextResponse } from "next/server"
import { execSync } from "child_process"

export async function GET() {
  try {
    if (process.platform !== "win32") {
      return NextResponse.json({ status: "manual", detail: "Windows 전용", link: "ms-settings:network-status" })
    }

    let sharesFound: string[] = []
    let networkDiscovery = false

    // 1. 공유 폴더 확인 ($ 제외한 실제 공유만)
    try {
      const raw = execSync(
        `powershell -NoProfile -Command "Get-SmbShare | Where-Object { $_.Name -notmatch '[$]' } | Select-Object -ExpandProperty Name"`,
        { encoding: "utf8", shell: "cmd.exe" }
      ).trim()
      sharesFound = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
    } catch {
      // Get-SmbShare 실패시 net share로 대체
      try {
        const raw2 = execSync(`net share`, { encoding: "buffer", shell: "cmd.exe" }).toString("utf8")
        sharesFound = raw2.split(/\r?\n/)
          .slice(3)
          .map(l => l.split(/\s+/)[0])
          .filter(n => n && n.length > 0 && !n.endsWith("$") && !n.includes("---") && !n.includes("공유") && !n.includes("Share"))
      } catch {}
    }

    // 2. 네트워크 검색 — 방화벽 규칙 대신 레지스트리로 확인
    try {
      const reg = execSync(
        `reg query "HKLM\\SYSTEM\\CurrentControlSet\\Services\\fdrespub" /v Start`,
        { encoding: "buffer", shell: "cmd.exe" }
      ).toString("utf8")
      const m = reg.match(/Start\s+REG_DWORD\s+(0x[\da-fA-F]+)/i)
      if (m) {
        const val = parseInt(m[1], 16)
        // 2=자동, 3=수동, 4=사용안함
        networkDiscovery = val <= 3
      }
    } catch {}

    const hasIssue = sharesFound.length > 0
    const status = hasIssue ? "fail" : "pass"

    const details: string[] = []
    if (sharesFound.length > 0) details.push(`공유 폴더 발견: ${sharesFound.join(", ")}`)
    if (networkDiscovery) details.push("네트워크 검색 서비스 활성")
    if (!hasIssue) details.push("파일 공유 없음 — 양호")

    return NextResponse.json({
      status,
      detail: details.join(" / "),
      shares: sharesFound,
      networkDiscovery,
      link: "ms-settings:network-status",
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ status: "manual", detail: `조회 실패 (${msg.slice(0, 60)})`, shares: [], link: "ms-settings:network-status" })
  }
}
