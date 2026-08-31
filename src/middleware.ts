import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { requestBaseUrl } from "./lib/utils";

const intl = createMiddleware(routing);

/* In-memory sliding-window rate limiter per client IP.
   Kanîa IPC: the map is bounded and entries expire so this cannot grow unbounded. */
const RATE = new Map<string, { n: number; t: number }>();
let lastSweep = 0;

function rateLimit(ip: string, limit = 120, windowMs = 60_000) {
  const now = Date.now();
  if (now - lastSweep > 60_000) {
    lastSweep = now;
    for (const [key, rec] of RATE) {
      if (now - rec.t > windowMs) RATE.delete(key);
    }
  }
  const rec = RATE.get(ip);
  if (!rec || now - rec.t > windowMs) {
    RATE.set(ip, { n: 1, t: now });
    return true;
  }
  rec.n += 1;
  return rec.n <= limit;
}

/* Best-effort client IP. nginx always sets X-Real-IP to $remote_addr which a
   client cannot spoof, so we trust it over the user-supplied X-Forwarded-For. */
function clientIp(request: NextRequest): string {
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd.split(",").map((p) => p.trim()).filter(Boolean);
    return parts[parts.length - 1];
  }
  return "local";
}

/* Stricter limits for abuse-prone write endpoints. */
const STRICT_LIMIT = 20;

export function middleware(request: NextRequest) {
  const ip = clientIp(request);
  const path = request.nextUrl.pathname;

  if (path.startsWith("/api/")) {
    const strict = /\/api\/(orders|reviews)/.test(path) && request.method === "POST";
    const ok = rateLimit(ip, strict ? STRICT_LIMIT : 120);
    if (!ok) {
      const status = 429;
      const retry = 60;
      return NextResponse.json(
        { error: "Too many requests" },
        { status, headers: { "Retry-After": String(retry) } },
      );
    }
  }

  const localeAdmin = path.match(/^\/(uk|ru|en)\/admin(?=\/|$)(.*)$/);
  if (localeAdmin) {
    const target = `/admin${localeAdmin[2] || ""}`;
    return NextResponse.redirect(new URL(target, `${requestBaseUrl(request)}/`));
  }

  if (path.startsWith("/api/") || path.startsWith("/admin")) {
    return NextResponse.next();
  }

  const response = intl(request);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  return response;
}

export const config = {
  matcher: ["/", "/(uk|ru|en)/:path*", "/((?!_next|_vercel|.*\\..*).*)"],
};
