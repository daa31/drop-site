import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export default async function Success({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ n?: string; t?: string }>;
}) {
  const { locale } = await params;
  const { n, t } = await searchParams;
  const tr = await getTranslations({ locale, namespace: "checkout" });
  return (
    <div className="container-f py-20 text-center">
      <h1 className="font-display text-3xl">{tr("success")}</h1>
      <p className="mt-4 text-graphite/70">{tr("successText", { n: n || "" })}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {t && (
          <Link href={`/order/${t}`} prefetch={false} className="inline-block rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white">
            {tr("publicTitle")}
          </Link>
        )}
        <Link href="/catalog" className="inline-block rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-ink">
          {tr("catalogLink")}
        </Link>
      </div>
    </div>
  );
}