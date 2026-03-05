import { NextResponse } from "next/server"
import { execSync } from "child_process"

export async function GET() {
  try {
    if (process.platform === "win32") {
      const raw = execSync(
        'reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\AutoplayHandlers" /v DisableAutoplay 2>nul',
        { encoding: "utf8", shell: "cmd.exe" }
      )
      const disabled = raw.includes("0x1")
      return NextResponse.json({
        status: disabled ? "pass" : "warn",
        detail: disabled ? "USB 자동실행 비활성화 — 양호" : "USB 자동실행 활성화됨 — 비활성화 권장",
        link: "ms-settings:autoplay"
      })
    } else {
      return NextResponse.json({ status: "manual", detail: "Linux USB 정책 수동 확인 필요", link: "" })
    }
  } catch {
    return NextResponse.json({ status: "warn", detail: "USB 자동실행 상태 확인 불가 — 수동 확인 권장", link: "ms-settings:autoplay" })
  }
}
