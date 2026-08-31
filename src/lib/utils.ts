import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { normalizeCatalogText } from "./localization";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, locale: string = "uk") {
  const value = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${value} ${locale === "en" ? "UAH" : "грн"}`;
}

export function tJson(value: unknown, locale: string): string {
  if (!value) return "";
  if (typeof value === "string") return normalizeCatalogText(value, locale);
  const obj = value as Record<string, string>;
  return normalizeCatalogText(obj[locale] || obj.uk || obj.ru || obj.en || "", locale);
}

export function slugify(input: string) {
  const map: Record<string, string> = {
    "\u0430": "a", "\u0431": "b", "\u0432": "v", "\u0433": "h", "\u0491": "g", "\u0434": "d",
    "\u0435": "e", "\u0454": "ie", "\u0436": "zh", "\u0437": "z", "\u0438": "y", "\u0456": "i",
    "\u0457": "i", "\u0439": "i", "\u043a": "k", "\u043b": "l", "\u043c": "m", "\u043d": "n",
    "\u043e": "o", "\u043f": "p", "\u0440": "r", "\u0441": "s", "\u0442": "t", "\u0443": "u",
    "\u0444": "f", "\u0445": "kh", "\u0446": "ts", "\u0447": "ch", "\u0448": "sh", "\u0449": "shch",
    "\u044c": "", "\u044e": "iu", "\u044f": "ia", "\u044b": "y", "\u044d": "e", "\u044a": "",
  };
  const slug = input
    .toLowerCase()
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "item";
}

export function roundPrice(value: number, mode: string = "99") {
  if (mode === "none") return Math.round(value);
  if (mode === "10") return Math.ceil(value / 10) * 10;
  if (mode === "50") return Math.ceil(value / 50) * 50;
  return Math.ceil(value / 10) * 10 - 1;
}

export function cleanBaseUrl(value?: string | null) {
  const raw = value?.trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return `${url.origin}${url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "")}`;
  } catch {
    return "";
  }
}

export function isLocalBaseUrl(value: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/i.test(value);
}

export function publicSiteBase(settings?: Record<string, string>) {
  const candidates = [
    cleanBaseUrl(settings?.site_url),
    cleanBaseUrl(process.env.NEXT_PUBLIC_SITE_URL),
  ].filter(Boolean);
  return candidates.find((c) => !isLocalBaseUrl(c)) || candidates[0] || "";
}

type BaseUrlRequest = {
  nextUrl: { origin: string };
  headers: { get(name: string): string | null };
};

export function requestBaseUrl(req: BaseUrlRequest) {
  const env = cleanBaseUrl(process.env.NEXT_PUBLIC_SITE_URL);
  if (env && !isLocalBaseUrl(env)) return env;
  const proto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const host =
    req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    req.headers.get("host")?.trim();
  if (proto && host) return `${proto}://${host}`;
  return env || req.nextUrl.origin;
}
