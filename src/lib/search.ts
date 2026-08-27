import { prisma } from "./db";

export async function searchProducts(q: string, locale: string, take = 8) {
  const query = q.trim();
  if (query.length < 2) return [];

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { sku: { contains: query } },
        { supplierArticle: { contains: query } },
        { slug: { contains: query.toLowerCase() } },
        { brand: { name: { contains: query } } },
      ],
    },
    include: { brand: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    take: 40,
  });

  const all = await prisma.product.findMany({
    where: { isActive: true },
    include: { brand: true, images: { orderBy: { sortOrder: "asc" }, take: 1 }, categories: { include: { category: true } } },
    take: 400,
  });

  const needle = query.toLowerCase();
  const scored = all
    .map((p) => {
      const name = JSON.stringify(p.name).toLowerCase();
      const attrs = JSON.stringify(p.attributes).toLowerCase();
      const cats = p.categories.map((c) => JSON.stringify(c.category.name).toLowerCase()).join(" ");
      const brand = p.brand?.name.toLowerCase() || "";
      let score = 0;
      if (p.sku.toLowerCase() === needle || p.supplierArticle.toLowerCase() === needle) score += 100;
      if (p.sku.toLowerCase().includes(needle) || p.supplierArticle.toLowerCase().includes(needle)) score += 50;
      if (brand.includes(needle)) score += 40;
      if (name.includes(needle)) score += 30;
      if (cats.includes(needle)) score += 15;
      if (attrs.includes(needle)) score += 10;
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, take)
    .map((x) => x.p);

  const ids = new Set(scored.map((p) => p.id));
  for (const p of products) {
    if (!ids.has(p.id)) scored.push(p);
  }
  return scored.slice(0, take);
}
