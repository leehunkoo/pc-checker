import { NextResponse } from "next/server"
import { execSync } from "child_process"

export async function GET() {
  try {
    if (process.platform !== "win32") {
      return NextResponse.json({ status: "manual", detail: "Windows 전용", link: "ms-settings:privacy-encryptionaboutpage" })
    }

    let encrypted = false
    let detail = ""

    // 방법1: manage-bde (BitLocker 전용 명령)
    try {
      const raw = execSync(
        `manage-bde -status C:`,
        { encoding: "buffer", shell: "cmd.exe" }
      ).toString("utf8")

      if (raw.match(/Protection On|보호 켜기|암호화됨/i)) {
        encrypted = true
        detail = "C: 드라이브 BitLocker 암호화 활성 — 양호"
      } else if (raw.match(/Protection Off|보호 끄기|암호화되지 않음/i)) {
        encrypted = false
        detail = "C: 드라이브 BitLocker 비활성"
      } else {
        detail = "BitLocker 상태 불명확"
      }
    } catch {}

    // 방법2: PowerShell Get-BitLockerVolume
    if (!detail) {
      try {
        const raw2 = execSync(
          `powershell -NoProfile -Command "(Get-BitLockerVolume -MountPoint C:).ProtectionStatus"`,
          { encoding: "utf8", shell: "cmd.exe" }
        ).trim()
        if (raw2 === "On") { encrypted = true; detail = "C: 드라이브 BitLocker 암호화 활성 — 양호" }
        else if (raw2 === "Off") { encrypted = false; detail = "C: 드라이브 BitLocker 비활성" }
        else { detail = `BitLocker 상태: ${raw2}` }
      } catch {}
    }

    if (!detail) {
      return NextResponse.json({ status: "manual", detail: "BitLocker 상태 조회 실패 — 수동 확인 필요", link: "ms-settings:privacy-encryptionaboutpage" })
    }

    return NextResponse.json({
      status: encrypted ? "pass" : "warn",
      detail,
      link: "ms-settings:privacy-encryptionaboutpage"
    })
  } catch {
    return NextResponse.json({ status: "manual", detail: "BitLocker 조회 실패 — 수동 확인", link: "ms-settings:privacy-encryptionaboutpage" })
  }
}
