import type { NextConfig } from "next";

// Базовые защитные заголовки для всех страниц. Строгий CSP не включаем: Next вставляет inline-скрипты,
// для CSP с nonce нужен отдельный middleware (см. docs/01-app/02-guides/content-security-policy.md).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  // приложение не должно открываться во фрейме чужого сайта (кликджекинг)
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
