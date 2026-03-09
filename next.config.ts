import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // pdfkit은 Next.js 번들링에서 제외 (API 라우트에서 직접 node_modules 참조)
  serverExternalPackages: ["pdfkit"],
  // 외부 접근 차단 - localhost만 허용
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "127.0.0.1:3000"],
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ]
  },
}

export default nextConfig