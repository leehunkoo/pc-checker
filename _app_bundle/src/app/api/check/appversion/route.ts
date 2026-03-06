import { NextResponse } from "next/server"
import { execSync } from "child_process"
function runPS(cmd: string): string { try { return execSync(`powershell -NoProfile -Command "${cmd}"`, { encoding: "utf8", shell: "cmd.exe", timeout: 10000 }).trim() } catch { return "" } }
export async function GET() {
  if (process.platform !== "win32") return NextResponse.json({ status: "manual", detail: "Windows 전용", apps: [] })
  const targets = [
    { name: "한글", keys: ["한글", "Hancom", "HWP"] },
    { name: "MS Office", keys: ["Microsoft Office", "Office 365", "Microsoft 365"] },
    { name: "Chrome", keys: ["Google Chrome"] },
    { name: "Edge", keys: ["Microsoft Edge"] },
    { name: "Firefox", keys: ["Mozilla Firefox"] },
  ]
  const raw = runPS("$r=@();@('HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*')|%{if(Test-Path $_){$r+=Get-ItemProperty $_ -EA SilentlyContinue|?{$_.DisplayName}|Select DisplayName,DisplayVersion}};$r|ConvertTo-Json -Depth 2")
  let allApps: any[] = []
  try { const p = JSON.parse(raw); allApps = Array.isArray(p) ? p : [p] } catch {}
  const apps = targets.map(t => {
    const found = allApps.find(a => t.keys.some(k => (a.DisplayName||"").includes(k)))
    return { name: t.name, version: found?.DisplayVersion||"-", status: found?"pass":"warn", detail: found?`${found.DisplayName} ${found.DisplayVersion||""}`:"설치되지 않음" }
  })
  const failCount = apps.filter(a => a.status !== "pass").length
  return NextResponse.json({ status: failCount===0?"pass":failCount<=2?"warn":"fail", detail: `주요 프로그램 ${apps.filter(a=>a.status==="pass").length}개 확인됨`, apps })
}