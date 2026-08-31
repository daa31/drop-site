import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { listProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { tJson } from "@/lib/utils";
import { CatalogControls } from "@/components/CatalogControls";
import { Link } from "@/i18n/routing";
import { ArrowRight, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

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

function pageItems(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const items = new Set<number>();
  for (let item = 1; item <= Math.min(5, total); item += 1) items.add(item);
  for (let item = current - 1; item <= current + 1; item += 1) {
    if (item > 1 && item < total) items.add(item);
  }
  for (let item = Math.max(1, total - 4); item <= total; item += 1) items.add(item);
  items.add(total);
  return Array.from(items).sort((a, b) => a - b);
}

function PageButton({
  href,
  label,
  active,
  disabled,
  children,
}: {
  href: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  const className = `grid h-11 w-11 place-items-center rounded-full border border-black/10 text-sm transition ${
    active ? "bg-ink text-white" : "bg-white hover:border-ink"
  } ${disabled ? "pointer-events-none opacity-35" : ""}`;

  if (disabled) {
    return (
      <span className={className} aria-disabled="true" title={label}>
        {children}
      </span>
    );
  }

  return (
    <Link href={href} prefetch={false} className={className} aria-label={label} aria-current={active ? "page" : undefined} title={label}>
      {children}
    </Link>
  );
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
  const paginationItems = pageItems(page, data.pages);

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
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {data.items.map((p, index) => (
                  <div key={p.id} className="catalog-item" style={{ animationDelay: `${Math.min(index, 11) * 55}ms` }}>
                    <ProductCard p={p} locale={locale} />
                  </div>
                ))}
              </div>
            )}
            {data.pages > 1 && (
              <div className="mt-8 flex max-w-full flex-wrap items-center gap-2">
                <PageButton href={pageHref(1, sp)} label={t("firstPage")} disabled={page === 1}>
                  <ChevronFirst size={17} />
                </PageButton>
                <PageButton href={pageHref(Math.max(1, page - 1), sp)} label={t("prevPage")} disabled={page === 1}>
                  <ChevronLeft size={17} />
                </PageButton>
                {paginationItems.map((item, index) => (
                  <div key={item} className="contents">
                    {index > 0 && item - paginationItems[index - 1] > 1 && <span className="px-1 text-sm text-graphite/40">...</span>}
                    <PageButton href={pageHref(item, sp)} label={`${t("pageLabel")} ${item}`} active={page === item}>
                      {item}
                    </PageButton>
                  </div>
                ))}
                <PageButton href={pageHref(Math.min(data.pages, page + 1), sp)} label={t("nextPage")} disabled={page === data.pages}>
                  <ChevronRight size={17} />
                </PageButton>
                <PageButton href={pageHref(data.pages, sp)} label={t("lastPage")} disabled={page === data.pages}>
                  <ChevronLast size={17} />
                </PageButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
