import { NextResponse } from "next/server"
import { execSync } from "child_process"

function runPS(cmd: string): string {
  try { return execSync(`powershell -NoProfile -Command "${cmd}"`, { encoding: "utf8", shell: "cmd.exe", timeout: 10000 }).trim() } catch { return "" }
}

async function fetchLatestVersions(): Promise<Record<string,string>> {
  const versions: Record<string,string> = {}
  try {
    // Chrome - fraction=1 (100% 배포 완료된 버전만)
    const res = await fetch("https://versionhistory.googleapis.com/v1/chrome/platforms/win/channels/stable/versions/all/releases?filter=fraction=1,endtime=none&order_by=version%20desc&pageSize=1", { signal: AbortSignal.timeout(5000) })
    const data = await res.json()
    if (data?.releases?.[0]?.version) versions.chrome = data.releases[0].version
  } catch {}
  try {
    // Edge - Microsoft 공식 API
    const res = await fetch("https://edgeupdates.microsoft.com/api/products?view=enterprise", { signal: AbortSignal.timeout(5000) })
    const data = await res.json()
    const stable = data?.find((p:any) => p.Product === "Stable")
    const win = stable?.Releases?.find((r:any) => r.Platform === "Windows" && r.Architecture === "x64")
    if (win?.ProductVersion) versions.edge = win.ProductVersion
  } catch {}
  try {
    // Firefox - Mozilla 공식 API
    const res = await fetch("https://product-details.mozilla.org/1.0/firefox_versions.json", { signal: AbortSignal.timeout(5000) })
    const data = await res.json()
    if (data?.LATEST_FIREFOX_VERSION) versions.firefox = data.LATEST_FIREFOX_VERSION
  } catch {}
  return versions
}

function compareVersion(installed: string, latest: string): boolean {
  if (!installed || !latest) return true
  const a = installed.split(".").map(Number)
  const b = latest.split(".").map(Number)
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] || 0, y = b[i] || 0
    if (x < y) return false
    if (x > y) return true
  }
  return true
}

export async function GET() {
  if (process.platform !== "win32") return NextResponse.json({ status: "manual", detail: "Windows 전용", apps: [] })

  const raw = runPS("$r=@();@('HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*')|%{if(Test-Path $_){$r+=Get-ItemProperty $_ -EA SilentlyContinue|?{$_.DisplayName}|Select DisplayName,DisplayVersion,InstallDate}};$r|ConvertTo-Json -Depth 2")

  let allApps: any[] = []
  try { const p = JSON.parse(raw); allApps = Array.isArray(p) ? p : [p] } catch {}

  const latest = await fetchLatestVersions()

  const targets = [
    { name: "Google Chrome",   keys: ["Google Chrome"],                                  latestKey: "chrome"  },
    { name: "Microsoft Edge",  keys: ["Microsoft Edge"],                                 latestKey: "edge"    },
    { name: "Mozilla Firefox", keys: ["Mozilla Firefox"],                                latestKey: "firefox" },
    { name: "MS Office",       keys: ["Microsoft 365", "Office 16", "Microsoft Office"], latestKey: ""        },
    { name: "한글",            keys: ["한글", "Hancom", "HWP"],                          latestKey: ""        },
  ]

  const apps = targets.map(t => {
    const found = allApps.find(a => t.keys.some(k => (a.DisplayName || "").includes(k)))
    if (!found) return { name: t.name, version: "-", latestVersion: latest[t.latestKey] || "-", status: "warn", detail: "설치되지 않음" }

    const ver = found.DisplayVersion || ""
    const latestVer = latest[t.latestKey] || ""

    if (latestVer) {
      const isOk = compareVersion(ver, latestVer)
      return {
        name: t.name, version: ver, latestVersion: latestVer,
        status: isOk ? "pass" : "warn",
        detail: isOk ? `${ver} ✅ 최신` : `${ver} → 최신: ${latestVer} ⚠️ 업데이트 필요`
      }
    }

    // Office, 한글은 설치일 기준 (6개월)
    const installDate = found.InstallDate || ""
    if (installDate && installDate.length === 8) {
      const y = parseInt(installDate.slice(0,4)), mo = parseInt(installDate.slice(4,6)), d = parseInt(installDate.slice(6,8))
      const daysSince = Math.floor((Date.now() - new Date(y, mo-1, d).getTime()) / 86400000)
      const isOk = daysSince <= 180
      return {
        name: t.name, version: ver, latestVersion: "-",
        status: isOk ? "pass" : "warn",
        detail: isOk ? `${ver} (${Math.floor(daysSince/30)}개월 전 설치)` : `${ver} — ${Math.floor(daysSince/30)}개월 전 설치, 업데이트 확인 권장`
      }
    }

    return { name: t.name, version: ver, latestVersion: "-", status: "pass", detail: `${ver}` }
  })

  const warnCount = apps.filter(a => a.status !== "pass").length
  return NextResponse.json({
    status: warnCount === 0 ? "pass" : warnCount <= 2 ? "warn" : "fail",
    detail: `주요 프로그램 ${apps.filter(a => a.status === "pass").length}/${apps.length}개 최신`,
    apps,
  })
}