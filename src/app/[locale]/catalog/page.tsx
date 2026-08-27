import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { listProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { tJson } from "@/lib/utils";
import { CatalogControls } from "@/components/CatalogControls";
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";

function pageHref(item: number, sp: Record<string, string | string[] | undefined>) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (key === "page" || value == null) continue;
    next.set(key, Array.isArray(value) ? value[0] : value);
  }
  if (item > 1) next.set("page", String(item));
  const query = next.toString();
  return query ? `?${query}` : "?";
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug?: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, slug } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "catalog" });
  const n = await getTranslations({ locale, namespace: "nav" });

  const category = slug ? await prisma.category.findUnique({ where: { slug } }) : null;
  const selectedCategory = slug || String(sp.category || "");
  const page = Math.max(1, Number(sp.page || 1));
  const data = await listProducts({
    category: selectedCategory,
    q: String(sp.q || ""),
    sort: String(sp.sort || "popular"),
    min: sp.min ? Number(sp.min) : undefined,
    max: sp.max ? Number(sp.max) : undefined,
    lens: String(sp.lens || ""),
    antiFog: String(sp.af || ""),
    photo: String(sp.photo || ""),
    polar: String(sp.polar || ""),
    rx: String(sp.rx || ""),
    interchangeable: String(sp.il || ""),
    brand: String(sp.brand || ""),
    page,
    locale,
  });

  const [brands, categories] = await Promise.all([
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({
      where: { products: { some: { product: { isActive: true } } } },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true },
    }),
  ]);
  const title = category ? tJson(category.name, locale) : t("title");
  const eyebrow = locale === "en" ? "Locko catalog" : "Каталог Locko";
  const pageItems = Array.from(
    new Set([1, Math.max(1, page - 1), page, Math.min(data.pages, page + 1), data.pages]),
  ).filter((item) => item >= 1 && item <= data.pages);

  return (
    <div className="overflow-x-hidden pb-16">
      <section className="border-b border-black/10 bg-white">
        <div className="container-f py-10">
          <Breadcrumbs
            items={[
              { href: "/", label: "Locko" },
              { href: "/catalog", label: n("catalog") },
              ...(category ? [{ label: title }] : []),
            ]}
          />
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-graphite/45">{eyebrow}</p>
              <h1 className="mt-2 font-display text-4xl">{title}</h1>
              <p className="mt-2 text-sm text-graphite/60">
                {t("found")}: {data.total}
              </p>
            </div>
            <Link href="/guide" prefetch={false} className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white">
              {n("guide")} <ArrowRight size={16} />
            </Link>
          </div>
          {category?.seoText && <p className="mt-5 max-w-3xl text-sm leading-6 text-graphite/70">{tJson(category.seoText, locale)}</p>}
        </div>
      </section>

      <div className="container-f">
        <div className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <CatalogControls brands={brands} categories={categories} currentCategory={selectedCategory} locale={locale} />
          <div className="min-w-0">
            {data.items.length === 0 ? (
              <div className="rounded-lg border border-black/10 bg-white p-10 text-center shadow-card">
                <p>{t("empty")}</p>
                <Link href="/catalog" prefetch={false} className="mt-4 inline-block text-sm underline">
                  {t("reset")}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-5 xl:grid-cols-3">
                {data.items.map((p) => (
                  <ProductCard key={p.id} p={p} locale={locale} />
                ))}
              </div>
            )}
            {data.pages > 1 && (
              <div className="mt-8 flex max-w-full flex-wrap items-center gap-2">
                {pageItems.map((item, index) => (
                  <div key={item} className="contents">
                    {index > 0 && item - pageItems[index - 1] > 1 && <span className="px-1 text-sm text-graphite/40">...</span>}
                    <Link
                      href={pageHref(item, sp)}
                      prefetch={false}
                      className={`grid h-10 w-10 place-items-center rounded-full border border-black/10 ${page === item ? "bg-ink text-white" : "bg-white"}`}
                    >
                      {item}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
