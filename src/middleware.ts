import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { requestBaseUrl } from "./lib/utils";

const intl = createMiddleware(routing);

const RATE: Record<string, { n: number; t: number }> = {};

function rateLimit(ip: string, limit = 80, windowMs = 60_000) {
  const now = Date.now();
  const rec = RATE[ip];
  if (!rec || now - rec.t > windowMs) {
    RATE[ip] = { n: 1, t: now };
    return true;
  }
  rec.n += 1;
  return rec.n <= limit;
}

export function middleware(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (request.nextUrl.pathname.startsWith("/api/") && !rateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const path = request.nextUrl.pathname;
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
