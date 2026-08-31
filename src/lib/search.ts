import { prisma } from "./db";

export async function searchProducts(q: string, locale: string, take = 8) {
  const query = q.trim();
  if (query.length < 2) return [];
  const ids = await findSearchProductIds(query, Math.max(take * 8, 80));
  if (ids.length === 0) return [];

  const candidates = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      slug: true,
      sku: true,
      supplierArticle: true,
      name: true,
      popularity: true,
      brand: { select: { name: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
    },
  });
  const order = new Map(ids.map((id, index) => [id, index]));

  void locale;
  return candidates
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    .slice(0, take);
}

export async function findSearchProductIds(q: string, limit = 200) {
  const query = q.trim();
  if (query.length < 2) return [];
  const safeLimit = Math.min(Math.max(limit, 1), 5000);

  const rows = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      sku: true,
      supplierArticle: true,
      name: true,
      shortDescription: true,
      description: true,
      attributes: true,
      popularity: true,
      updatedAt: true,
      brand: { select: { name: true } },
    },
    orderBy: [{ popularity: "desc" }, { updatedAt: "desc" }],
  });

  return rows
    .map((p) => ({ id: p.id, score: scoreProduct(p, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, safeLimit)
    .map((item) => item.id);
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

function scoreProduct(p: {
  sku: string;
  supplierArticle: string;
  name: unknown;
  shortDescription: unknown;
  description: unknown;
  attributes: unknown;
  popularity: number;
  brand?: { name: string } | null;
}, query: string) {
  const needle = normalize(query);
  const tokenGroups = needle.split(" ").filter((token) => token.length > 1).map(tokenAlternates);
  const sku = normalize(p.sku);
  const article = normalize(p.supplierArticle);
  const brand = normalize(p.brand?.name || "");
  const name = normalize(valueText(p.name));
  const short = normalize(valueText(p.shortDescription));
  const description = normalize(valueText(p.description));
  const attributes = normalize(valueText(p.attributes));
  const all = [sku, article, brand, name, short, description, attributes].join(" ");

  const directMatch = needle.length > 1 && all.includes(needle);
  const everyTokenMatches = tokenGroups.every((group) => group.some((token) => all.includes(token)));
  if (!directMatch && !everyTokenMatches) return 0;

  let score = 1;
  if (sku === needle || article === needle) score += 500;
  if (name === needle) score += 420;
  if (brand === needle) score += 260;
  if (sku.includes(needle) || article.includes(needle)) score += 220;
  if (name.includes(needle)) score += 180;
  if (brand.includes(needle)) score += 130;
  if (short.includes(needle)) score += 70;
  if (description.includes(needle)) score += 35;

  for (const group of tokenGroups) {
    if (group.some((token) => sku.includes(token) || article.includes(token))) score += 54;
    if (group.some((token) => name.includes(token))) score += 42;
    if (group.some((token) => brand.includes(token))) score += 26;
    if (group.some((token) => short.includes(token) || description.includes(token))) score += 12;
  }

  return score + Math.min(p.popularity || 0, 1000) / 1000;
}

function tokenAlternates(token: string) {
  const values = new Set<string>([token]);
  addStem(values, token);

  const dictionary: Record<string, string[]> = {
    "\u043a\u043b\u0456\u043f\u0441\u0430": ["\u043a\u043b\u0456\u043f\u0441", "\u043a\u043b\u0438\u043f\u0441\u0430", "\u043a\u043b\u0438\u043f\u0441", "clip"],
    "\u043a\u043b\u0456\u043f\u0441": ["\u043a\u043b\u0456\u043f\u0441\u0430", "\u043a\u043b\u0438\u043f\u0441\u0430", "\u043a\u043b\u0438\u043f\u0441", "clip"],
    "\u043a\u043b\u0438\u043f\u0441\u0430": ["\u043a\u043b\u0438\u043f\u0441", "\u043a\u043b\u0456\u043f\u0441\u0430", "\u043a\u043b\u0456\u043f\u0441", "clip"],
    "\u043a\u043b\u0438\u043f\u0441": ["\u043a\u043b\u0438\u043f\u0441\u0430", "\u043a\u043b\u0456\u043f\u0441\u0430", "\u043a\u043b\u0456\u043f\u0441", "clip"],
    clip: ["\u043a\u043b\u0456\u043f\u0441", "\u043a\u043b\u0438\u043f\u0441"],
  };
  for (const value of dictionary[token] || []) values.add(value);

  for (const value of [...values]) {
    values.add(value.replace(/\u0456/g, "\u0438").replace(/\u0457/g, "\u0438").replace(/\u0454/g, "\u0435").replace(/\u0491/g, "\u0433"));
    values.add(value.replace(/\u0438/g, "\u0456").replace(/\u044b/g, "\u0438").replace(/\u0451/g, "\u0435"));
  }

  return [...values].filter((value) => value.length > 1);
}

function addStem(values: Set<string>, token: string) {
  const stem = token.replace(/(\u0430\u043c\u0438|\u044f\u043c\u0438|\u043e\u0433\u043e|\u044c\u043e\u0433\u043e|\u043e\u043c\u0443|\u044c\u043e\u043c\u0443|\u0438\u043c\u0438|\u0456\u0432|\u043e\u0432|\u0435\u0439|\u0430\u043c|\u044f\u043c|\u0430\u0445|\u044f\u0445|\u0438\u0439|\u0456\u0439|\u0430\u044f|\u043e\u0435|\u044b\u0435|\u0438\u0435|\u043e\u044e|\u0435\u044e|\u0430|\u0443|\u044e|\u0438|\u0456|\u0435|\u044b|\u044f|\u044c)$/u, "");
  if (stem.length >= 3 && stem !== token) values.add(stem);
}

function valueText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(valueText).join(" ");
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).map(valueText).join(" ");
  return "";
}
