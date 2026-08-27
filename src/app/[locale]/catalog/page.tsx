import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { listProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { tJson } from "@/lib/utils";
import { CatalogControls } from "@/components/CatalogControls";
import { Link } from "@/i18n/routing";

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

  const category = slug
    ? await prisma.category.findUnique({ where: { slug } })
    : null;

  const page = Number(sp.page || 1);
  const data = await listProducts({
    category: slug,
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

  const brands = await prisma.brand.findMany();
  const title = category ? tJson(category.name, locale) : t("title");

  return (
    <div className="container-f pb-16">
      <Breadcrumbs
        items={[
          { href: "/", label: "FORTIS" },
          { href: "/catalog", label: n("catalog") },
          ...(category ? [{ label: title }] : []),
        ]}
      />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-graphite/60">
            {t("found")}: {data.total}
          </p>
        </div>
      </div>
      {category?.seoText && (
        <p className="mt-4 max-w-3xl text-sm text-graphite/70">{tJson(category.seoText, locale)}</p>
      )}
      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <CatalogControls brands={brands} />
        <div>
          {data.items.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-card">
              <p>{t("empty")}</p>
              <Link href="/catalog" className="mt-4 inline-block text-sm underline">
                {t("reset")}
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.items.map((p) => (
                <ProductCard key={p.id} p={p} locale={locale} />
              ))}
            </div>
          )}
          {data.pages > 1 && (
            <div className="mt-8 flex gap-2">
              {Array.from({ length: data.pages }, (_, i) => (
                <Link
                  key={i}
                  href={`?page=${i + 1}`}
                  className={`grid h-10 w-10 place-items-center rounded-full ${page === i + 1 ? "bg-ink text-white" : "bg-white"}`}
                >
                  {i + 1}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
