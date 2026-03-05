import { NextResponse } from "next/server"
import { execSync } from "child_process"

function queryReg(nameFilter: string): string {
  const paths = [
    `HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall`,
    `HKLM\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall`,
    `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall`,
  ]
  for (const p of paths) {
    try {
      // reg query로 서브키 목록 가져오기
      const keys = execSync(`reg query "${p}"`, { encoding: "buffer", shell: "cmd.exe" })
        .toString("utf8").split(/\r?\n/).map(s => s.trim()).filter(Boolean)

      for (const key of keys) {
        try {
          const info = execSync(`reg query "${key}" /v DisplayName`, { encoding: "buffer", shell: "cmd.exe" }).toString("utf8")
          if (info.toLowerCase().includes(nameFilter.toLowerCase())) {
            const ver = execSync(`reg query "${key}" /v DisplayVersion`, { encoding: "buffer", shell: "cmd.exe" }).toString("utf8")
            const m = ver.match(/DisplayVersion\s+REG_SZ\s+(.+)/i)
            if (m) return m[1].trim()
          }
        } catch {}
      }
    } catch {}
  }
  return ""
}

// 더 빠른 방법: PowerShell로 한번에 특정 앱만 검색
function queryPS(nameFilter: string): string {
  try {
    const raw = execSync(
      `powershell -NoProfile -Command "Get-ItemProperty 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*' -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -like '*${nameFilter}*' } | Select-Object -First 1 -ExpandProperty DisplayVersion"`,
      { encoding: "utf8", shell: "cmd.exe", timeout: 8000 }
    ).trim()
    return raw
  } catch {
    return ""
  }
}

export async function GET() {
  const apps: Array<{ name: string; installed: boolean; version: string; status: string; detail: string }> = []

  // 한컴오피스
  const hancom = queryPS("한컴") || queryPS("HancomOffice") || queryPS("Hancom Office")
  if (hancom) {
    const major = parseInt(hancom.split(".")[0]) || 0
    apps.push({ name: "한컴오피스", installed: true, version: hancom, status: major >= 12 ? "pass" : "warn", detail: `버전 ${hancom}${major < 12 ? " — 업데이트 권장" : ""}` })
  } else {
    apps.push({ name: "한컴오피스", installed: false, version: "-", status: "pass", detail: "미설치" })
  }

  // MS Office
  const office = queryPS("Microsoft 365") || queryPS("Microsoft Office") || queryPS("Office 365")
  if (office) {
    const major = parseInt(office.split(".")[0]) || 0
    apps.push({ name: "Microsoft Office", installed: true, version: office, status: major >= 16 ? "pass" : "warn", detail: `버전 ${office}${major < 16 ? " — 업데이트 권장" : ""}` })
  } else {
    apps.push({ name: "Microsoft Office", installed: false, version: "-", status: "pass", detail: "미설치" })
  }

  // Chrome
  const chrome = queryPS("Google Chrome")
  if (chrome) {
    const major = parseInt(chrome.split(".")[0]) || 0
    apps.push({ name: "Google Chrome", installed: true, version: chrome, status: major >= 120 ? "pass" : "warn", detail: `버전 ${chrome}${major < 120 ? " — 업데이트 필요" : ""}` })
  }

  // Edge
  const edge = queryPS("Microsoft Edge")
  if (edge) {
    const major = parseInt(edge.split(".")[0]) || 0
    apps.push({ name: "Microsoft Edge", installed: true, version: edge, status: major >= 120 ? "pass" : "warn", detail: `버전 ${edge}${major < 120 ? " — 업데이트 필요" : ""}` })
  }

  // Firefox
  const firefox = queryPS("Mozilla Firefox")
  if (firefox) {
    const major = parseInt(firefox.split(".")[0]) || 0
    apps.push({ name: "Mozilla Firefox", installed: true, version: firefox, status: major >= 120 ? "pass" : "warn", detail: `버전 ${firefox}${major < 120 ? " — 업데이트 필요" : ""}` })
  }

  const hasWarn = apps.some(a => a.status === "warn")
  return NextResponse.json({
    status: hasWarn ? "warn" : "pass",
    detail: hasWarn ? "업데이트 필요 프로그램 있음" : "주요 프로그램 최신 상태",
    apps,
  })
}
