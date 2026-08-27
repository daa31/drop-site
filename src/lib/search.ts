import { prisma } from "./db";

export async function searchProducts(q: string, locale: string, take = 8) {
  const query = q.trim();
  if (query.length < 2) return [];
  const needle = normalize(query);
  const tokens = needle.split(" ").filter((token) => token.length > 1);

  const all = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      slug: true,
      sku: true,
      supplierArticle: true,
      name: true,
      brand: { select: { name: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
    },
    take: 1200,
  });

  const scored = all
    .map((p) => {
      const localizedName = typeof p.name === "object" && p.name && locale in p.name ? String((p.name as Record<string, unknown>)[locale]) : "";
      const name = normalize([localizedName, JSON.stringify(p.name)].join(" "));
      const brand = normalize(p.brand?.name || "");
      const sku = normalize(p.sku);
      const article = normalize(p.supplierArticle);
      let score = 0;
      if (sku === needle || article === needle) score += 140;
      if (sku.includes(needle) || article.includes(needle)) score += 90;
      if (name.includes(needle)) score += 120;
      if (brand.includes(needle)) score += 45;
      for (const token of tokens) {
        if (sku.includes(token) || article.includes(token)) score += 22;
        if (brand.includes(token)) score += 14;
        if (name.includes(token)) score += 10;
      }
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, take)
    .map((x) => x.p);

  return scored.slice(0, take);
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[™®]/g, "")
    .replace(/[+/_-]/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
