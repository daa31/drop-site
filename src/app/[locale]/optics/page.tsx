import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { toCard } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Link } from "@/i18n/routing";
import { ArrowRight, Eye, Sparkles, Sun } from "lucide-react";

const OPTICS_CATEGORIES = ["dioptrychni-rishennia", "fotokhromni-okuliary", "poliaryzatsiini-okuliary"];

export default async function OpticsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "optics" });
  const n = await getTranslations({ locale, namespace: "nav" });

  const [dioptric, photo, polar] = await Promise.all(
    OPTICS_CATEGORIES.map((slug) =>
      prisma.product.findMany({
        where: { isActive: true, images: { some: {} }, categories: { some: { category: { slug } } } },
        include: { brand: true, images: { take: 1 } },
        orderBy: { popularity: "desc" },
        take: 6,
      }),
    ),
  );

  const blocks = [
    { key: "dioptric", icon: Eye, items: dioptric },
    { key: "photo", icon: Sun, items: photo },
    { key: "polar", icon: Sparkles, items: polar },
  ];

  return (
    <div className="pb-16">
      <section className="border-b border-black/10 bg-white">
        <div className="container-f py-10">
          <Breadcrumbs items={[{ href: "/", label: "Locko" }, { href: "/optics", label: t("title") }]} />
          <p className="text-xs uppercase tracking-[0.24em] text-graphite/45">{t("eyebrow")}</p>
          <h1 className="mt-2 font-display text-4xl">{t("title")}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-graphite/70">{t("intro")}</p>
          <Link
            href="/catalog"
            prefetch={false}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white transition hover:bg-black"
          >
            {n("catalog")} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <div className="container-f mt-10 grid gap-10">
        {blocks.map(({ key, icon: Icon, items }) => (
          <section key={key}>
            <div className="flex items-center gap-2">
              <Icon size={20} className="text-accent" />
              <h2 className="font-display text-2xl">{t(`${key}Title`)}</h2>
            </div>
            <p className="mt-1 text-sm text-graphite/60">{t(`${key}Text`)}</p>
            {items.length ? (
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((p) => (
                  <ProductCard key={p.id} p={toCard(p)} locale={locale} />
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm text-graphite/50">{t("empty")}</p>
            )}
          </section>
        ))}
      </div>

      {t.has("seoText") && (
        <section className="container-f mt-12">
          <div className="rounded-lg border border-black/10 bg-white p-6 text-sm leading-6 text-graphite/75 shadow-card">
            {t("seoText")}
          </div>
        </section>
      )}
    </div>
  );
}
