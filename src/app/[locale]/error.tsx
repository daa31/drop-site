"use client";

import { useTranslations } from "next-intl";

export default function ErrorPage() {
  const t = useTranslations("errors");

  return (
    <div className="container-f py-20 text-center">
      <h1 className="font-display text-3xl">500</h1>
      <p className="mt-3 text-graphite/70">{t("500")}</p>
    </div>
  );
}
