import { NextRequest, NextResponse } from "next/server"
import { execFileSync } from "child_process"
import path from "path"
import fs from "fs"
import os from "os"

export async function POST(req: NextRequest) {
  let tmpDir = ""
  try {
    const body = await req.json()
    const { results, inspector, format } = body

    tmpDir = path.join(os.tmpdir(), `sec_report_${Date.now()}`)
    fs.mkdirSync(tmpDir, { recursive: true })

    const jsonPath = path.join(tmpDir, "results.json")
    fs.writeFileSync(jsonPath, JSON.stringify(results ?? {}, null, 2), "utf-8")

    const scriptPath = path.join(process.cwd(), "scripts", "report_generator.py")

    // python 또는 python3 자동 선택
    let pythonCmd = "python"
    try { execFileSync("python", ["--version"]) } catch {
      try { execFileSync("python3", ["--version"]); pythonCmd = "python3" } catch {}
    }

    const args = [
      scriptPath,
      "--format", format ?? "both",
      "--results", jsonPath,
      "--name", inspector?.name ?? "점검자",
      "--dept", inspector?.dept ?? "-",
      "--os", inspector?.os ?? "Windows",
      "--output-dir", tmpDir,
    ]

    try {
      execFileSync(pythonCmd, args, { encoding: "utf8", timeout: 30000, maxBuffer: 1024 * 1024 * 20, env: { ...process.env, PYTHONIOENCODING: "utf-8", PYTHONUTF8: "1" } })
    } catch (pyErr: unknown) {
      const msg = pyErr instanceof Error ? pyErr.message : String(pyErr)
      try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch {}
      return NextResponse.json({ success: false, error: `Python 오류: ${msg.slice(0, 300)}` }, { status: 500 })
    }

    const files = fs.readdirSync(tmpDir).filter(f => f !== "results.json")
    if (files.length === 0) {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch {}
      return NextResponse.json({ success: false, error: "보고서 파일이 생성되지 않았습니다." }, { status: 500 })
    }

    const readB64 = (filename: string) =>
      fs.readFileSync(path.join(tmpDir, filename)).toString("base64")

    if (format === "both") {
      const pdfFile  = files.find(f => f.endsWith(".pdf"))
      const xlsxFile = files.find(f => f.endsWith(".xlsx"))
      const result: Record<string, string | boolean> = { success: true, format: "both" }
      if (pdfFile)  { result.pdf = readB64(pdfFile);   result.pdfName = pdfFile }
      if (xlsxFile) { result.xlsx = readB64(xlsxFile); result.xlsxName = xlsxFile }
      try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch {}
      return NextResponse.json(result)
    }

    const ext = format === "excel" ? ".xlsx" : ".pdf"
    const target = files.find(f => f.endsWith(ext))
    if (!target) {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch {}
      return NextResponse.json({ success: false, error: `${ext} 파일을 찾을 수 없습니다.` }, { status: 500 })
    }

    const data = readB64(target)
    try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch {}
    return NextResponse.json({ success: true, format, data, filename: target })

  } catch (err: unknown) {
    if (tmpDir) try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch {}
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: `서버 오류: ${msg.slice(0, 200)}` }, { status: 500 })
  }
}
