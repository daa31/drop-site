"use client";

import { useRouter, usePathname } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";

const HOME_PATHS = new Set(["/", "/uk", "/ru", "/en"]);

export function BackButton({ label = "Назад" }: { label?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  if (HOME_PATHS.has(pathname)) return null;

  return (
    <div className="container-f pt-4">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label={label}
        className="group inline-flex h-10 items-center gap-2 rounded-full border border-black/10 bg-white px-3 text-sm font-medium text-graphite shadow-sm transition hover:border-ink hover:text-ink"
      >
        <ArrowLeft size={17} className="transition group-hover:-translate-x-0.5" />
      </button>
    </div>
  );
}
