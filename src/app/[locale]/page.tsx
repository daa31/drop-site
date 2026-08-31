import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/db";
import { tJson } from "@/lib/utils";
import { toCard } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { ArrowRight, BadgeCheck, CreditCard, Glasses, Headphones, Shield, Sparkles, Truck } from "lucide-react";

export const dynamic = "force-dynamic";

const collectionImages = [
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&w=1200&q=82",
];

const categoryImages = [
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=82",
];

function localCopy(locale: string) {
  if (locale === "ru") {
    return {
      brandLine: "Locko / защитные очки",
      taskEyebrow: "По задаче",
      collection: "Подборка",
      recommended: "Рекомендуем",
      statModels: "моделей в каталоге",
      guideEyebrow: "Подбор по задаче",
      guideTitle: "Locko подбирает очки под вашу задачу",
      guideText: "Укажите, где будете использовать очки, какую линзу хотите и нужен ли Anti-Fog. Покажем модели, которые подходят по этим условиям.",
    };
  }
  if (locale === "en") {
    return {
      brandLine: "Locko / protective eyewear",
      taskEyebrow: "Shop by task",
      collection: "Collection",
      recommended: "Recommended",
      statModels: "models in catalog",
      guideEyebrow: "Selection guide",
      guideTitle: "Locko matches eyewear to your use case",
      guideText: "Choose where you will use the eyewear, the lens type and whether you need Anti-Fog. We will show models that fit those conditions.",
    };
  }
  return {
    brandLine: "Locko / захисні окуляри",
    taskEyebrow: "За задачею",
    collection: "Підбірка",
    recommended: "Рекомендуємо",
    statModels: "моделей у каталозі",
    guideEyebrow: "Підбір за задачею",
    guideTitle: "Locko підбирає окуляри під вашу задачу",
    guideText: "Оберіть, де будете користуватися окулярами, який тип лінзи потрібен і чи потрібен Anti-Fog. Покажемо моделі, що підходять під ці умови.",
  };
}

function randomHeroImages(urls: string[]): string[] {
  const pool = [...new Set(urls)].filter(Boolean);
  if (pool.length <= 3) return pool;
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 3);
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const h = await getTranslations({ locale, namespace: "hero" });
  const copy = localCopy(locale);

  const [categories, hits, sale, neu, productsCount, banners, productsWithImages] = await Promise.all([
    prisma.category.findMany({
      where: { products: { some: { product: { isActive: true, images: { some: {} } } } } },
      orderBy: { sortOrder: "asc" },
      include: {
        products: {
          where: { product: { isActive: true, images: { some: {} } } },
          include: { product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } } },
          take: 1,
        },
      },
    }),
    prisma.product.findMany({
      where: { isActive: true, isHit: true },
      include: { brand: true, images: { take: 1 } },
      orderBy: { popularity: "desc" },
      take: 8,
    }),
    prisma.product.findMany({
      where: { isActive: true, isSale: true },
      include: { brand: true, images: { take: 1 } },
      orderBy: { discountPercent: "desc" },
      take: 4,
    }),
    prisma.product.findMany({
      where: { isActive: true, isNew: true },
      include: { brand: true, images: { take: 1 } },
      take: 4,
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.banner.findMany({
      where: { active: true, slot: { startsWith: "home_hero" } },
      orderBy: [{ sortOrder: "asc" }, { slot: "asc" }],
    }),
    prisma.product.findMany({
      where: { isActive: true, images: { some: {} } },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    }),
  ]);
  const heroBanner = banners.find((banner) => banner.slot === "home_hero");
  const bannerHeroImages = banners
    .filter((banner) => ["home_hero_1", "home_hero_2", "home_hero_3"].includes(banner.slot))
    .sort((a, b) => a.slot.localeCompare(b.slot))
    .map((banner) => banner.image)
    .filter(Boolean);
  const activeHeroImages =
    bannerHeroImages.length >= 3
      ? bannerHeroImages.slice(0, 3)
      : randomHeroImages(productsWithImages.map((product) => product.images[0]?.url));
  const heroTitle = tJson(heroBanner?.title, locale) || h("title");
  const heroSubtitle = tJson(heroBanner?.subtitle, locale) || h("subtitle");
  const heroHref = heroBanner?.href || "/catalog";

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
            name: "Locko",
            url: process.env.NEXT_PUBLIC_SITE_URL,
            potentialAction: {
              "@type": "SearchAction",
              target: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/catalog?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />

      <section className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-ink text-white">
        <div className="absolute inset-0 grid grid-cols-3">
          {activeHeroImages.map((image, index) => (
            <div
              key={image}
              className="relative overflow-hidden"
              style={{
                clipPath:
                  index === 0
                    ? "polygon(0 0, 100% 0, 82% 100%, 0 100%)"
                    : index === 1
                      ? "polygon(18% 0, 100% 0, 82% 100%, 0 100%)"
                      : "polygon(18% 0, 100% 0, 100% 100%, 0 100%)",
                marginLeft: index === 0 ? 0 : "-8vw",
                width: index === 0 ? "calc(100% + 8vw)" : "calc(100% + 16vw)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div className="absolute inset-0 overflow-hidden p-[12%]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt=""
                  className="h-full w-full rounded-xl object-cover opacity-85"
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,18,20,0.92),rgba(17,18,20,0.62),rgba(17,18,20,0.22))]" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-ink to-transparent" />
        <div className="container-f relative flex min-h-[calc(100vh-72px)] flex-col justify-end pb-10 pt-[120px] sm:pt-24">
          <div className="max-w-4xl pb-8">
            <p className="text-xs uppercase tracking-[0.32em] text-white/60">{copy.brandLine}</p>
            <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">{heroTitle}</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">{heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={heroHref} className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-white transition hover:bg-accentHover">
                {h("catalog")}
                <ArrowRight size={17} />
              </Link>
              <Link href="/guide" className="inline-flex h-12 items-center rounded-full border border-white/25 px-6 text-sm font-semibold text-white transition hover:bg-white hover:text-ink">
                {h("guide")}
              </Link>
            </div>
          </div>
          <div className="max-w-xs overflow-hidden rounded-lg border border-white/10 bg-white/10 backdrop-blur-md">
            <div className="bg-white/8 p-5">
              <div className="text-2xl font-semibold">{productsCount}+</div>
              <div className="mt-1 text-xs uppercase tracking-wide text-white/55">{copy.statModels}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-f py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-graphite/50">{copy.taskEyebrow}</p>
            <h2 className="mt-2 font-display text-3xl">{t("categories")}</h2>
          </div>
          <Link href="/catalog" className="inline-flex items-center gap-2 text-sm font-semibold">
            {t("popular")} <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.slice(0, 8).map((c, index) => {
            const image = c.products[0]?.product.images[0]?.url || c.image || categoryImages[index % categoryImages.length];
            return (
              <Link
                key={c.slug}
                href={`/catalog/${c.slug}`}
                className={`group relative min-h-44 overflow-hidden rounded-lg border border-black/10 bg-ink p-5 text-white shadow-card transition hover:-translate-y-1 hover:border-ink ${
                  index === 0 ? "lg:col-span-2" : ""
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-700 group-hover:scale-[1.05]"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,18,20,0.12),rgba(17,18,20,0.78))]" />
                <div className="relative flex h-full flex-col justify-between">
                  <span className="text-xs uppercase tracking-wide text-white/65">0{index + 1}</span>
                  <span className="mt-12 text-lg font-semibold leading-tight group-hover:underline">{tJson(c.name, locale)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="container-f pb-16">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          {categories.slice(0, 3).map((c, index) => {
            const image = c.products[0]?.product.images[0]?.url || c.image || collectionImages[index];
            return (
              <Link
                key={c.slug}
                href={`/catalog/${c.slug}`}
                className={`group relative min-h-[360px] overflow-hidden rounded-lg bg-ink text-white shadow-card ${
                  index === 0 ? "lg:row-span-2 lg:min-h-[620px]" : ""
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" loading="lazy" decoding="async" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,18,20,0.1),rgba(17,18,20,0.78))]" />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur">
                    <Sparkles size={14} />
                    {copy.collection}
                  </div>
                  <h2 className="max-w-md font-display text-3xl leading-tight sm:text-4xl">{tJson(c.name, locale)}</h2>
                  <div className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-ink transition group-hover:bg-accent group-hover:text-white">
                    {h("catalog")}
                    <ArrowRight size={16} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="container-f pb-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-graphite/50">{copy.recommended}</p>
            <h2 className="mt-2 font-display text-3xl">{t("popular")}</h2>
          </div>
          <Link href="/catalog" className="inline-flex items-center gap-2 text-sm font-semibold">
            {h("catalog")} <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {hits.map((p, index) => (
            <div key={p.id} className="catalog-item" style={{ animationDelay: `${Math.min(index, 11) * 55}ms` }}>
              <ProductCard locale={locale} p={toCard(p)} />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-f grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-graphite/50">{t("why")}</p>
            <h2 className="mt-2 font-display text-3xl">{t("why")}</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/locko-l-logo.png"
              alt="Locko"
              className="mt-6 h-auto w-full max-w-[420px] select-none sm:max-w-[520px] lg:max-w-full"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="grid gap-px overflow-hidden rounded-lg border border-black/10 bg-black/10 sm:grid-cols-2">
            {why.map(([Icon, title, desc]) => (
              <div key={title} className="bg-white p-6">
                <Icon size={22} />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-graphite/70">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-f py-16">
        <div className="relative overflow-hidden rounded-lg bg-ink px-6 py-16 text-white shadow-card sm:px-10 lg:px-14">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1800&q=82"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,18,20,0.96),rgba(17,18,20,0.72),rgba(17,18,20,0.25))]" />
          <div className="relative max-w-2xl">
            <p className="text-xs uppercase tracking-[0.24em] text-white/55">{copy.guideEyebrow}</p>
            <h2 className="mt-3 font-display text-4xl leading-tight">{copy.guideTitle}</h2>
            <p className="mt-4 text-sm leading-6 text-white/70">{copy.guideText}</p>
            <Link href="/guide" className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-white transition hover:bg-accentHover">
              {h("guide")}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {(sale.length > 0 || neu.length > 0) && (
        <section className="container-f py-16">
          <div className="grid gap-10 lg:grid-cols-2">
            {sale.length > 0 && (
              <div>
                <h2 className="mb-6 font-display text-2xl">{t("sale")}</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  {sale.map((p, index) => (
                    <div key={p.id} className="catalog-item" style={{ animationDelay: `${Math.min(index, 11) * 55}ms` }}>
                      <ProductCard locale={locale} p={toCard(p)} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {neu.length > 0 && (
              <div>
                <h2 className="mb-6 font-display text-2xl">{t("new")}</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  {neu.map((p, index) => (
                    <div key={p.id} className="catalog-item" style={{ animationDelay: `${Math.min(index, 11) * 55}ms` }}>
                      <ProductCard locale={locale} p={toCard(p)} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
