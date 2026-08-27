import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export default async function Success({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ n?: string }>;
}) {
  const { locale } = await params;
  const { n } = await searchParams;
  const t = await getTranslations({ locale, namespace: "checkout" });
  return (
    <div className="container-f py-20 text-center">
      <h1 className="font-display text-3xl">{t("success")}</h1>
      <p className="mt-4 text-graphite/70">{t("successText").replace("{n}", n || "")}</p>
      <Link href="/catalog" className="mt-8 inline-block rounded-full bg-ink px-6 py-3 text-white">
        FORTIS
      </Link>
    </div>
  );
}
