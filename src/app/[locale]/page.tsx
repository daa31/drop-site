import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/db";
import { tJson } from "@/lib/utils";
import { toCard } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { Shield, Truck, BadgeCheck, Headphones, CreditCard, Glasses } from "lucide-react";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const h = await getTranslations({ locale, namespace: "hero" });
  const [categories, hits, sale, neu] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({
      where: { isActive: true, isHit: true },
      include: { brand: true, images: { take: 1 } },
      orderBy: { popularity: "desc" },
      take: 8,
    }),
    prisma.product.findMany({
      where: { isActive: true, isSale: true },
      include: { brand: true, images: { take: 1 } },
      take: 8,
    }),
    prisma.product.findMany({
      where: { isActive: true, isNew: true },
      include: { brand: true, images: { take: 1 } },
      take: 4,
    }),
  ]);

  const why = [
    [Glasses, t("why1t"), t("why1d")],
    [BadgeCheck, t("why2t"), t("why2d")],
    [Shield, t("why3t"), t("why3d")],
    [Truck, t("why4t"), t("why4d")],
    [Headphones, t("why5t"), t("why5d")],
    [CreditCard, t("why6t"), t("why6d")],
  ] as const;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "FORTIS",
            url: process.env.NEXT_PUBLIC_SITE_URL,
            potentialAction: {
              "@type": "SearchAction",
              target: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/catalog?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="container-f grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/50">FORTIS</p>
            <h1 className="mt-4 font-display text-4xl leading-[1.1] md:text-6xl">{h("title")}</h1>
            <p className="mt-5 max-w-md text-lg text-white/70">{h("subtitle")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/catalog" className="rounded-full bg-accent px-6 py-3 text-sm font-medium">
                {h("catalog")}
              </Link>
              <Link href="/guide" className="rounded-full border border-white/20 px-6 py-3 text-sm">
                {h("guide")}
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1400&q=80"
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="container-f py-16">
        <h2 className="font-display text-2xl md:text-3xl">{t("categories")}</h2>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/catalog/${c.slug}`}
              className="rounded-2xl bg-white p-4 text-sm shadow-card transition hover:-translate-y-0.5"
            >
              {tJson(c.name, locale)}
            </Link>
          ))}
        </div>
      </section>

      <section className="container-f pb-16">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-2xl">{t("popular")}</h2>
          <Link href="/catalog" className="text-sm text-graphite/60">
            →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {hits.map((p) => (
            <ProductCard key={p.id} locale={locale} p={toCard(p)} />
          ))}
        </div>
      </section>

      <section className="container-f pb-16">
        <h2 className="mb-6 font-display text-2xl">{t("sale")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sale.map((p) => (
            <ProductCard key={p.id} locale={locale} p={toCard(p)} />
          ))}
        </div>
      </section>

      {neu.length > 0 && (
        <section className="container-f pb-16">
          <h2 className="mb-6 font-display text-2xl">{t("new")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {neu.map((p) => (
              <ProductCard key={p.id} locale={locale} p={toCard(p)} />
            ))}
          </div>
        </section>
      )}

      <section className="bg-white py-16">
        <div className="container-f">
          <h2 className="font-display text-2xl">{t("why")}</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {why.map(([Icon, title, desc]) => (
              <div key={title} className="rounded-2xl border border-black/5 p-6">
                <Icon size={22} />
                <h3 className="mt-3 font-medium">{title}</h3>
                <p className="mt-2 text-sm text-graphite/70">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
