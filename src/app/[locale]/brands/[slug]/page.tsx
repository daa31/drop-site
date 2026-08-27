import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { tJson } from "@/lib/utils";
import { ProductCard } from "@/components/ProductCard";
import { toCard } from "@/lib/catalog";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default async function BrandPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  const brand = await prisma.brand.findUnique({
    where: { slug },
    include: { products: { where: { isActive: true }, include: { images: { take: 1 }, brand: true } } },
  });
  if (!brand) notFound();
  return (
    <div className="container-f py-10">
      <Breadcrumbs items={[{ href: "/", label: "Locko" }, { href: "/brands", label: t("brands") }, { label: brand.name }]} />
      <h1 className="font-display text-3xl">{brand.name}</h1>
      <p className="mt-3 max-w-2xl text-graphite/70">{tJson(brand.description, locale)}</p>
      <div className="mt-8 grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {brand.products.map((p) => (
          <ProductCard key={p.id} p={toCard(p)} locale={locale} />
        ))}
      </div>
    </div>
  );
}
