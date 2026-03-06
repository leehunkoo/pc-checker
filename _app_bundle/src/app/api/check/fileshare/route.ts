import { NextResponse } from "next/server"
import { execSync } from "child_process"

function runCmd(cmd: string): string {
  try { return execSync(cmd, { encoding: "buffer", shell: "cmd.exe", timeout: 6000 }).toString("utf8").trim() } catch { return "" }
}

const SYSTEM_SHARES = ["C$", "ADMIN$", "IPC$", "PRINT$", "D$", "E$", "F$"]

export async function GET() {
  if (process.platform !== "win32") return NextResponse.json({ status: "manual", detail: "Windows 전용", shares: [], link: "" })

  const raw = runCmd("net share")
  const lines = raw.split(/\r?\n/)

  const shares: Array<{name:string, path:string, remark:string}> = []
  for (const line of lines) {
    const parts = line.trim().split(/\s{2,}/)
    const name = parts[0]
    if (!name || SYSTEM_SHARES.includes(name.toUpperCase())) continue
    if (line.includes("공유 이름") || line.includes("Share name") || line.includes("---") || line.includes("명령이") || line.includes("성공")) continue
    if (name.length > 0 && !name.includes(" ")) {
      shares.push({ name, path: parts[1] || "-", remark: parts[2] || "-" })
    }
  }

  if (shares.length === 0) {
    return NextResponse.json({ status: "pass", detail: "불필요한 파일 공유 없음", shares: [], link: "" })
  }
  return NextResponse.json({
    status: "fail",
    detail: `파일 공유 ${shares.length}개 활성화됨 — 확인 필요`,
    shares,
    link: "ms-settings:network-status"
  })
}

export async function DELETE(req: Request) {
  try {
    const { name } = await req.json()
    if (!name || typeof name !== "string" || name.length > 80) {
      return NextResponse.json({ success: false, error: "잘못된 공유 이름" })
    }
    // 시스템 공유 삭제 방지
    if (SYSTEM_SHARES.includes(name.toUpperCase())) {
      return NextResponse.json({ success: false, error: "시스템 공유는 삭제할 수 없습니다" })
    }
    // 특수문자 방지 (인젝션 방지)
    if (!/^[\w\-가-힣\s]+$/.test(name)) {
      return NextResponse.json({ success: false, error: "잘못된 공유 이름" })
    }
    runCmd(`net share "${name}" /delete /y`)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) })
  }
}