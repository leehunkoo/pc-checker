import { NextResponse } from "next/server"
import fs from "fs"
import pathModule from "path"
// @ts-ignore
import PDFDocument from "pdfkit/js/pdfkit.standalone"

const SECTIONS = [
  { title: "1. 계정 및 비밀번호 관리", items: [
    { id:"1-1", text:"개인 계정과 공용 계정을 분리하여 사용하고 있다." },
    { id:"1-2", text:"계정 비밀번호는 8자리 이상(대소문자+숫자+특수문자 조합)으로 설정하여 있다." },
    { id:"1-3", text:"동일 비밀번호를 타 시스템에서도 사용하지 않는다." },
    { id:"1-4", text:"비밀번호를 주기적으로 변경하고 있다." },
    { id:"1-5", text:"화면보호기 잠금은 10분 이내로 설정하여 있다." },
    { id:"1-6", text:"자리비움·자리이동 시 화면 잠금을 실시한다." },
  ]},
  { title: "2. 악성코드 및 보안프로그램 대응", items: [
    { id:"2-1", text:"백신 프로그램이 설치되어 있다." },
    { id:"2-2", text:"백신 엔진 및 패턴이 항상 최신버전으로 업데이트되어 있다." },
    { id:"2-3", text:"실시간 감시 기능이 활성화되어 있다." },
    { id:"2-4", text:"정기적(주 1회 이상) 정밀 검사를 실시하고 있다." },
    { id:"2-5", text:"출처불명·의심스런 실행파일을 실행하지 않는다." },
    { id:"2-6", text:"방화벽이 활성화되어 있다. (V3 또는 Windows 방화벽)" },
  ]},
  { title: "3. 운영체제 및 소프트웨어 보안업데이트", items: [
    { id:"3-1", text:"운영체제(OS) 자동 업데이트가 설정되어 있다." },
    { id:"3-2", text:"주요 소프트웨어(브라우저, MS Office, 한글 등)가 최신버전이다." },
    { id:"3-3", text:"보안 취약점을 발견하면 즉시 업데이트한다." },
  ]},
  { title: "4. 개인정보 및 중요정보 보호", items: [
    { id:"4-1", text:"개인정보 파일을 암호화하여 보관한다." },
    { id:"4-2", text:"중요 문서는 책상 위 방치나 출력물을 방치하지 않는다." },
    { id:"4-3", text:"개인정보가 포함된 파일을 개인 이메일로 전송하지 않는다." },
    { id:"4-4", text:"업무 종료 후 바탕화면·다운로드 폴더에 개인정보를 방치하지 않는다." },
    { id:"4-5", text:"출력물은 즉시 회수하며, 불필요한 문서는 파쇄한다." },
  ]},
  { title: "5. 외부 저장매체 관리", items: [
    { id:"5-1", text:"USB 등 이동식 저장매체 사용 시 승인 절차를 따른다." },
    { id:"5-2", text:"사용 전·후 악성코드 검사를 실시한다." },
    { id:"5-3", text:"미인가 저장매체를 연결하지 않는다." },
    { id:"5-4", text:"분실 방지를 위한 관리대장을 운영한다." },
  ]},
  { title: "6. 네트워크 사용 보안", items: [
    { id:"6-1", text:"공용 Wi-Fi 사용 시 업무자료 전송을 제한한다." },
    { id:"6-2", text:"VPN 등 안전한 원격 접속 솔루션을 사용한다." },
    { id:"6-3", text:"불필요한 파일공유 기능이 비활성화되어 있다." },
  ]},
  { title: "7. 이메일 및 인터넷 사용 보안", items: [
    { id:"7-1", text:"출처가 불분명한 이메일 첨부파일을 열지 않는다." },
    { id:"7-2", text:"피싱 의심 메일은 즉시 보안담당자에게 신고한다." },
    { id:"7-3", text:"업무와 무관한 사이트 접속을 자제한다." },
  ]},
  { title: "8. 물리적 보안", items: [
    { id:"8-1", text:"PC에 자산관리 스티커가 부착되어 있다." },
    { id:"8-2", text:"사무실 외부 반출 시 승인 절차를 따른다." },
    { id:"8-3", text:"장비 폐기 시 저장매체 완전삭제를 실시한다." },
  ]},
  { title: "9. 개인정보 보호", items: [
    { id:"9-1", text:"개인정보 침해 사고 발생 시 즉시 보안담당자에게 신고한다." },
    { id:"9-2", text:"악성코드 감염 의심 시 네트워크를 차단하고 신고한다." },
  ]},
]

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const results = body.results || {}
    const userInfo = body.userInfo || body.inspector || {}
    const format = body.format || "pdf"

    const fontPath = pathModule.join(process.cwd(), "public", "fonts", "NanumGothic.ttf")
    const hasFontFile = fs.existsSync(fontPath)
    const fontData = hasFontFile ? fs.readFileSync(fontPath) : null

    const now = new Date()
    const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`

    const doc = new PDFDocument({ margin: 40, size: "A4", bufferPages: true })
    const buffers: Buffer[] = []
    doc.on("data", (chunk: Buffer) => buffers.push(chunk))
    const finishPromise = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(buffers))))

    if (fontData) {
      doc.registerFont("Korean", fontData)
      doc.font("Korean")
    }

    const W = 515 // usable width

    // ── 헤더 ──
    doc.fontSize(18).fillColor("#1e3a5f").text("PC 보안 자가점검 보고서", { align: "center" })
    doc.moveDown(0.2)
    doc.fontSize(10).fillColor("#64748b").text("정보보안 자율점검 및 보안취약점 개선을 위한 자가점검 결과", { align: "center" })
    doc.moveDown(0.4)
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#3b82f6").lineWidth(2).stroke()
    doc.moveDown(0.4)

    // ── 점검자 정보 테이블 ──
    const iY = doc.y
    doc.rect(40, iY, 120, 20).fill("#f1f5f9")
    doc.rect(280, iY, 120, 20).fill("#f1f5f9")
    doc.fontSize(9).fillColor("#475569")
    doc.text("점검자", 45, iY+6, { width: 110 })
    doc.text("부서", 285, iY+6, { width: 110 })
    doc.fillColor("#1e293b")
    doc.text(userInfo.name || "-", 165, iY+6, { width: 110 })
    doc.text(userInfo.dept || "-", 405, iY+6, { width: 110 })
    doc.rect(40, iY+20, 120, 20).fill("#f1f5f9")
    doc.rect(280, iY+20, 120, 20).fill("#f1f5f9")
    doc.fillColor("#475569")
    doc.text("점검일", 45, iY+26, { width: 110 })
    doc.text("OS", 285, iY+26, { width: 110 })
    doc.fillColor("#1e293b")
    doc.text(dateStr, 165, iY+26, { width: 110 })
    doc.text("Windows", 405, iY+26, { width: 110 })
    doc.rect(40, iY, W, 40).strokeColor("#e2e8f0").lineWidth(0.5).stroke()
    doc.moveTo(160, iY).lineTo(160, iY+40).stroke()
    doc.moveTo(280, iY).lineTo(280, iY+40).stroke()
    doc.moveTo(400, iY).lineTo(400, iY+40).stroke()
    doc.moveTo(40, iY+20).lineTo(555, iY+20).stroke()
    doc.y = iY + 48

    // ── 요약 ──
    const allItems = Object.entries(results)
    const passCount = allItems.filter(([,v]:any) => v?.status === "pass").length
    const failCount = allItems.filter(([,v]:any) => v?.status === "fail").length
    const warnCount = allItems.filter(([,v]:any) => v?.status === "warn").length
    const total = SECTIONS.reduce((a,s) => a + s.items.length, 0)
    const score = total > 0 ? Math.round(passCount / total * 100) : 0
    const scoreColor = score >= 80 ? "#166534" : score >= 60 ? "#92400e" : "#991b1b"
    const scoreBg = score >= 80 ? "#dcfce7" : score >= 60 ? "#fef9c3" : "#fee2e2"

    doc.fontSize(12).fillColor("#1e3a5f").text("점검 요약", { underline: false })
    doc.moveDown(0.2)

    const sY = doc.y
    const cols = [["전체 항목", `${total}개`], ["적합(양호)", `${passCount}개`], ["부적합", `${failCount}개`], ["보안 점수", `${score}점/100점`]]
    const cols2 = [["점검 완료", `${allItems.length}개`], ["주의", `${warnCount}개`], ["미점검", `${total - allItems.length}개`], ["등급", score>=80?"양호":score>=60?"보통":"부적합"]]
    const cW = W / 4

    cols.forEach((c, i) => {
      const x = 40 + i * cW
      doc.rect(x, sY, cW, 18).fill("#eff6ff").stroke()
      doc.fontSize(8).fillColor("#475569").text(c[0], x+4, sY+5, { width: cW-8 })
    })
    cols2.forEach((c, i) => {
      const x = 40 + i * cW
      doc.rect(x, sY+18, cW, 20).fill(i===3 ? scoreBg : "#fff").stroke()
      doc.fontSize(i===3?11:10).fillColor(i===3 ? scoreColor : "#1e293b").text(c[1], x+4, sY+23, { width: cW-8, align: i===3?"center":"left" })
    })
    doc.rect(40, sY, W, 38).strokeColor("#bfdbfe").lineWidth(0.5).stroke()
    doc.y = sY + 46

    // ── 세부 결과 ──
    doc.fontSize(12).fillColor("#1e3a5f").text("세부 점검 결과")
    doc.moveDown(0.2)

    const SL: Record<string,string> = { pass:"적합", fail:"부적합", warn:"주의", manual:"수동확인", pending:"미점검" }
    const SC: Record<string,string> = { pass:"#dcfce7", fail:"#fee2e2", warn:"#fef9c3", manual:"#f3e8ff", pending:"#f8fafc" }
    const ST: Record<string,string> = { pass:"#166534", fail:"#991b1b", warn:"#92400e", manual:"#6b21a8", pending:"#64748b" }

    for (const sec of SECTIONS) {
      // 새 페이지 필요한지 체크
      if (doc.y > 700) doc.addPage()

      const hY = doc.y
      doc.rect(40, hY, W, 16).fill("#1e3a5f").stroke()
      doc.fontSize(9).fillColor("#ffffff").text(sec.title, 44, hY+4, { width: W-8 })
      doc.y = hY + 16

      // 컬럼 헤더
      const rY = doc.y
      doc.rect(40, rY, 35, 14).fill("#334155").stroke()
      doc.rect(75, rY, 285, 14).fill("#334155").stroke()
      doc.rect(360, rY, 55, 14).fill("#334155").stroke()
      doc.rect(415, rY, 140, 14).fill("#334155").stroke()
      doc.fontSize(7.5).fillColor("#ffffff")
      doc.text("번호", 42, rY+4, { width:33, align:"center" })
      doc.text("점검 항목", 77, rY+4, { width:281 })
      doc.text("결과", 362, rY+4, { width:53, align:"center" })
      doc.text("세부 내용", 417, rY+4, { width:138 })
      doc.y = rY + 14

      for (const item of sec.items) {
        const r: any = results[item.id] || {}
        const st = r.status || "pending"
        const detail = (r.detail || "-").slice(0, 60)
        const rowH = 22

        if (doc.y > 750) doc.addPage()
        const rowY = doc.y

        doc.rect(40, rowY, 35, rowH).fill("#f8fafc").stroke()
        doc.rect(75, rowY, 285, rowH).fill("#ffffff").stroke()
        doc.rect(360, rowY, 55, rowH).fill(SC[st]||"#f8fafc").stroke()
        doc.rect(415, rowY, 140, rowH).fill("#ffffff").stroke()

        doc.fontSize(7.5).fillColor("#334155")
        doc.text(item.id, 42, rowY+7, { width:33, align:"center" })
        doc.text(item.text, 77, rowY+5, { width:281, height:rowH-2 })
        doc.fillColor(ST[st]||"#334155").text(SL[st]||"-", 362, rowY+7, { width:53, align:"center" })
        doc.fillColor("#334155").text(detail, 417, rowY+5, { width:138, height:rowH-2 })

        doc.rect(40, rowY, W, rowH).strokeColor("#e2e8f0").lineWidth(0.3).stroke()
        doc.y = rowY + rowH
      }
      doc.moveDown(0.4)
    }

    // ── 푸터 ──
    doc.moveDown(0.5)
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#cbd5e1").lineWidth(0.5).stroke()
    doc.moveDown(0.2)
    doc.fontSize(8).fillColor("#94a3b8").text(`본 보고서는 PC 보안 자가점검 시스템에 의해 자동 생성되었습니다. 생성시각: ${new Date().toLocaleString("ko-KR")}`, { align: "center", lineBreak: false })

    doc.end()
    const pdfBuffer = await finishPromise

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="security_report_${dateStr}.pdf"`,
      },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
