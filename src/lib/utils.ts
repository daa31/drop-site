import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, locale: string = "uk") {
  const loc = locale === "en" ? "en-US" : locale === "ru" ? "ru-UA" : "uk-UA";
  return new Intl.NumberFormat(loc, {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function tJson(value: unknown, locale: string): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  const obj = value as Record<string, string>;
  return obj[locale] || obj.uk || obj.ru || obj.en || "";
}

export function slugify(input: string) {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh",
    з: "z", и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n",
    о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
    ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia", ы: "y", э: "e", ъ: "",
  };
  return input
    .toLowerCase()
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function roundPrice(value: number, mode: string = "99") {
  if (mode === "none") return Math.round(value);
  if (mode === "10") return Math.ceil(value / 10) * 10;
  if (mode === "50") return Math.ceil(value / 50) * 50;
  return Math.ceil(value / 10) * 10 - 1;
}
