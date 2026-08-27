import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { tJson, formatPrice } from "@/lib/utils";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductCard } from "@/components/ProductCard";
import { toCard } from "@/lib/catalog";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductBuy } from "@/components/ProductBuy";
import { ReviewForm } from "@/components/ReviewForm";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { images: { take: 1 }, seo: true },
  });
  if (!product) return {};
  const title = tJson(product.seo?.title || product.name, locale);
  const description = tJson(product.seo?.description || product.shortDescription, locale);
  return {
    title,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: { title, description, images: product.images[0] ? [product.images[0].url] : [] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "product" });
  const n = await getTranslations({ locale, namespace: "nav" });
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      brand: true,
      images: { orderBy: { sortOrder: "asc" } },
      categories: { include: { category: true } },
      reviews: { where: { status: "approved" }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!product || !product.isActive) notFound();

  const related = await prisma.product.findMany({
    where: {
      isActive: true,
      id: { not: product.id },
      categories: { some: { categoryId: { in: product.categories.map((c) => c.categoryId) } } },
    },
    include: { brand: true, images: { take: 1 } },
    take: 4,
  });
  const together = await prisma.product.findMany({
    where: { isActive: true, categories: { some: { category: { slug: "aksesuary" } } } },
    include: { brand: true, images: { take: 1 } },
    take: 3,
  });

  const name = tJson(product.name, locale);
  const attrs = (product.attributes || {}) as Record<string, string>;
  const inStock = product.stockStatus === "in_stock" && product.stock > 0;
  const cat = product.categories[0]?.category;

  return (
    <div className="pb-24 lg:pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name,
            sku: product.sku,
            brand: product.brand?.name,
            image: product.images.map((i) => i.url),
            description: tJson(product.shortDescription, locale),
            offers: {
              "@type": "Offer",
              price: product.retailPrice,
              priceCurrency: "UAH",
              availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              url: `${process.env.NEXT_PUBLIC_SITE_URL}/product/${product.slug}`,
            },
            aggregateRating:
              product.ratingCount > 0
                ? { "@type": "AggregateRating", ratingValue: product.ratingAvg, reviewCount: product.ratingCount }
                : undefined,
          }),
        }}
      />
      <Breadcrumbs
        items={[
          { href: "/", label: "FORTIS" },
          { href: "/catalog", label: n("catalog") },
          ...(cat ? [{ href: `/catalog/${cat.slug}`, label: tJson(cat.name, locale) }] : []),
          ...(product.brand ? [{ href: `/brands/${product.brand.slug}`, label: product.brand.name }] : []),
          { label: name },
        ]}
      />
      <div className="container-f grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} alt={name} />
        <div>
          <div className="text-xs uppercase tracking-wide text-graphite/50">{product.brand?.name}</div>
          <h1 className="mt-2 font-display text-3xl leading-tight">{name}</h1>
          <div className="mt-2 text-sm text-graphite/60">
            {t("sku")}: {product.sku}
          </div>
          <div className={`mt-3 text-sm ${inStock ? "text-emerald-700" : "text-graphite/50"}`}>
            {inStock ? t("inStock") : t("out")}
          </div>
          <div className="mt-5 flex items-end gap-3">
            <span className="text-3xl font-semibold">{formatPrice(product.retailPrice, locale)}</span>
            {product.oldPrice && (
              <span className="text-lg text-graphite/40 line-through">{formatPrice(product.oldPrice, locale)}</span>
            )}
            {product.discountPercent > 0 && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-white">−{product.discountPercent}%</span>
            )}
          </div>
          <ProductBuy id={product.id} slug={product.slug} inStock={inStock} />
        </div>
      </div>

      <div className="container-f mt-14 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-xl">{t("short")}</h2>
          <p className="mt-3 text-graphite/80">{tJson(product.shortDescription, locale)}</p>
          {Array.isArray(product.benefits) && (product.benefits as string[]).length > 0 && (
            <>
              <h3 className="mt-8 font-medium">{t("benefits")}</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-graphite/80">
                {(product.benefits as string[]).map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </>
          )}
        </section>
        <section>
          <h2 className="font-display text-xl">{t("specs")}</h2>
          <table className="mt-3 w-full text-sm">
            <tbody>
              <tr className="border-b border-black/5">
                <td className="py-2 text-graphite/50">{t("brand")}</td>
                <td>{product.brand?.name}</td>
              </tr>
              <tr className="border-b border-black/5">
                <td className="py-2 text-graphite/50">{t("sku")}</td>
                <td>{product.sku}</td>
              </tr>
              {Object.entries(attrs).map(([k, v]) => (
                <tr key={k} className="border-b border-black/5">
                  <td className="py-2 text-graphite/50">{k}</td>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 className="mt-8 font-medium">{t("kit")}</h3>
          <p className="mt-2 text-sm text-graphite/80">{tJson(product.kit, locale)}</p>
          <h3 className="mt-6 font-medium">{t("usage")}</h3>
          <p className="mt-2 text-sm text-graphite/80">{tJson(product.usage, locale)}</p>
        </section>
      </div>

      <section className="container-f mt-14">
        <h2 className="font-display text-xl">{t("reviews")}</h2>
        <div className="mt-4 grid gap-4">
          {product.reviews.length === 0 && <p className="text-sm text-graphite/60">—</p>}
          {product.reviews.map((r) => (
            <div key={r.id} className="rounded-2xl bg-white p-4 shadow-card">
              <div className="text-sm font-medium">
                {r.authorName} · {r.rating}/5
              </div>
              <p className="mt-2 text-sm">{r.text}</p>
            </div>
          ))}
        </div>
        <ReviewForm productId={product.id} />
      </section>

      <section className="container-f mt-14">
        <h2 className="font-display text-xl">{t("related")}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((p) => (
            <ProductCard key={p.id} p={toCard(p)} locale={locale} />
          ))}
        </div>
      </section>
      <section className="container-f mt-10">
        <h2 className="font-display text-xl">{t("together")}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {together.map((p) => (
            <ProductCard key={p.id} p={toCard(p)} locale={locale} />
          ))}
        </div>
      </section>
    </div>
  );
}
