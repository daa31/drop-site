import { prisma } from "@/lib/db";

export default async function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const products = await prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } });
  const cats = await prisma.category.findMany({
    where: { products: { some: { product: { isActive: true } } } },
    select: { slug: true },
  });
  return [
    { url: base, lastModified: new Date() },
    { url: `${base}/catalog`, lastModified: new Date() },
    ...cats.map((c) => ({ url: `${base}/catalog/${c.slug}` })),
    ...products.map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
