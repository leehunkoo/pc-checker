import { NextResponse } from "next/server"
import { execSync } from "child_process"

export async function GET() {
  try {
    if (process.platform !== "win32") {
      return NextResponse.json({ status: "manual", detail: "Windows 전용", link: "ms-settings:personalization-lockscreen" })
    }

    // 화면보호기 활성화 여부
    let ssActive = false
    let ssTimeout = 9999
    let ssSecure = false // 암호 보호 여부

    try {
      const timeout = execSync(
        `reg query "HKCU\\Control Panel\\Desktop" /v ScreenSaveTimeOut`,
        { encoding: "buffer", shell: "cmd.exe" }
      ).toString("utf8")
      const m = timeout.match(/ScreenSaveTimeOut\s+REG_SZ\s+(\d+)/i)
      if (m) ssTimeout = parseInt(m[1])
    } catch {}

    try {
      const active = execSync(
        `reg query "HKCU\\Control Panel\\Desktop" /v ScreenSaveActive`,
        { encoding: "buffer", shell: "cmd.exe" }
      ).toString("utf8")
      ssActive = active.includes("1")
    } catch {}

    try {
      const secure = execSync(
        `reg query "HKCU\\Control Panel\\Desktop" /v ScreenSaverIsSecure`,
        { encoding: "buffer", shell: "cmd.exe" }
      ).toString("utf8")
      ssSecure = secure.includes("1")
    } catch {}

    const timeoutMin = ssTimeout === 9999 ? "?" : Math.round(ssTimeout / 60)

    if (!ssActive) {
      return NextResponse.json({ status: "fail", detail: "화면보호기 비활성화 — 즉시 설정 필요", link: "ms-settings:personalization-lockscreen" })
    }
    if (ssTimeout > 600) {
      return NextResponse.json({ status: "warn", detail: `화면보호기 ${timeoutMin}분 설정 — 10분 이내 권장`, link: "ms-settings:personalization-lockscreen" })
    }
    if (!ssSecure) {
      return NextResponse.json({ status: "warn", detail: `화면보호기 ${timeoutMin}분 / 잠금 암호 미설정 — 설정 권장`, link: "ms-settings:personalization-lockscreen" })
    }

    return NextResponse.json({ status: "pass", detail: `화면보호기 ${timeoutMin}분 / 잠금 암호 설정 — 양호`, link: "ms-settings:personalization-lockscreen" })
  } catch {
    return NextResponse.json({ status: "manual", detail: "화면보호기 설정 조회 실패 — 수동 확인", link: "ms-settings:personalization-lockscreen" })
  }
}
