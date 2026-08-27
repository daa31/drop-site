"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export function CookieBanner() {
  const t = useTranslations("legal");
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(!localStorage.getItem("fortis_cookie"));
  }, []);
  if (!show) return null;
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl rounded-2xl bg-ink p-4 text-sm text-white shadow-card">
      <p>{t("cookies")}</p>
      <button
        className="mt-3 rounded-full bg-white px-4 py-1.5 text-ink"
        onClick={() => {
          localStorage.setItem("fortis_cookie", "1");
          setShow(false);
        }}
      >
        {t("ok")}
      </button>
    </div>
  );
}
