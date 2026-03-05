import { NextResponse } from "next/server"
import { execSync } from "child_process"

export async function GET() {
  try {
    if (process.platform !== "win32") {
      return NextResponse.json({ status: "manual", detail: "Windows 전용 항목입니다", link: "ms-settings:signinoptions" })
    }

    let daysSince = 9999
    let lastSet = ""

    try {
      // PowerShell로 비밀번호 변경일 조회 (net user보다 안정적)
      const raw = execSync(
        `powershell -NoProfile -Command "$u = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name.Split('\\\\')[-1]; $d = (net user $u) -join ' '; if ($d -match 'Password last set\\s+(\\S+\\s+\\S+)') { $matches[1] } elseif ($d -match '암호 마지막 설정 날짜\\s+(\\S+)') { $matches[1] } else { '' }"`,
        { encoding: "utf8", shell: "cmd.exe", env: { ...process.env, PYTHONIOENCODING: "utf-8" } }
      ).trim()

      if (raw && raw.length > 4) {
        lastSet = raw
        const parsed = new Date(raw)
        if (!isNaN(parsed.getTime())) {
          daysSince = Math.floor((Date.now() - parsed.getTime()) / 86400000)
        }
      }
    } catch {}

    // 방법2: wmic 으로 시도
    if (daysSince === 9999) {
      try {
        const raw2 = execSync(
          `powershell -NoProfile -Command "(Get-LocalUser -Name $env:USERNAME).PasswordLastSet.ToString('yyyy-MM-dd')"`,
          { encoding: "utf8", shell: "cmd.exe" }
        ).trim()
        if (raw2 && raw2.length >= 8) {
          lastSet = raw2
          const parsed = new Date(raw2)
          if (!isNaN(parsed.getTime())) {
            daysSince = Math.floor((Date.now() - parsed.getTime()) / 86400000)
          }
        }
      } catch {}
    }

    if (daysSince === 9999) {
      return NextResponse.json({
        status: "manual",
        detail: "비밀번호 변경일 자동 조회 실패 — 수동 확인 필요",
        link: "ms-settings:signinoptions"
      })
    }

    const status = daysSince <= 30 ? "pass" : daysSince <= 90 ? "warn" : "fail"
    const detail = `마지막 변경: ${lastSet} (${daysSince}일 전)${daysSince > 30 ? " — 변경 권장" : " — 양호"}`

    return NextResponse.json({ status, detail, daysSince, lastSet, link: "ms-settings:signinoptions" })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ status: "manual", detail: "비밀번호 변경일 자동 조회 실패 — 수동 확인 필요", link: "ms-settings:signinoptions" })
  }
}
