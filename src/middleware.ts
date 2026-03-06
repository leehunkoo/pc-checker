import { NextRequest, NextResponse } from "next/server"

export function middleware(req: NextRequest) {
  // API 요청만 검증
  if (!req.nextUrl.pathname.startsWith("/api")) return NextResponse.next()

  const host = req.headers.get("host") || ""
  const forwarded = req.headers.get("x-forwarded-for") || ""
  const realIp = req.headers.get("x-real-ip") || ""

  // localhost, 127.0.0.1, ::1 만 허용
  const allowedHosts = ["localhost", "127.0.0.1", "::1"]
  const isLocalHost = allowedHosts.some(h => host.startsWith(h))
  const isLocalIp = !forwarded || forwarded.startsWith("127.") || forwarded.startsWith("::1") || forwarded === "localhost"
  const isLocalReal = !realIp || realIp.startsWith("127.") || realIp === "::1"

  if (!isLocalHost || !isLocalIp || !isLocalReal) {
    return new NextResponse(JSON.stringify({ error: "접근 거부" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    })
  }

  // API 경로 화이트리스트
  const allowedPaths = [
    "/api/check/antivirus",
    "/api/check/appversion",
    "/api/check/avscan",
    "/api/check/bitlocker",
    "/api/check/dlp",
    "/api/check/fileshare",
    "/api/check/firewall",
    "/api/check/password",
    "/api/check/screensaver",
    "/api/check/software",
    "/api/check/update",
    "/api/check/usb",
    "/api/report",
  ]

  const isAllowed = allowedPaths.some(p => req.nextUrl.pathname.startsWith(p))
  if (!isAllowed) {
    return new NextResponse(JSON.stringify({ error: "허용되지 않은 경로" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/api/:path*"
}