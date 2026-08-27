import { prisma } from "./db";
import { tJson } from "./utils";

export function toCard(p: {
  id: string;
  slug: string;
  sku: string;
  name: unknown;
  retailPrice: number;
  oldPrice: number | null;
  discountPercent: number;
  stockStatus: string;
  stock: number;
  isHit: boolean;
  isNew: boolean;
  isSale: boolean;
  brand?: { name: string } | null;
  images?: { url: string }[];
}) {
  return {
    id: p.id,
    slug: p.slug,
    sku: p.sku,
    name: p.name,
    brand: p.brand?.name ?? null,
    retailPrice: p.retailPrice,
    oldPrice: p.oldPrice,
    discountPercent: p.discountPercent,
    stockStatus: p.stockStatus,
    stock: p.stock,
    image: p.images?.[0]?.url ?? null,
    isHit: p.isHit,
    isNew: p.isNew,
    isSale: p.isSale,
  };
}

function lensMatches(value: string, selected?: string) {
  if (!selected) return true;
  const normalized = value.toLowerCase();
  const variants: Record<string, string[]> = {
    clear: ["clear", "проз", "безбарв", "бесцвет"],
    gray: ["gray", "grey", "smoke", "сер", "дим", "дым"],
    bronze: ["bronze", "brown", "amber", "бронз", "корич", "бурштин", "янтар"],
    yellow: ["yellow", "жовт", "желт"],
    mirror: ["mirror", "дзерк", "зерк"],
    dark: ["dark", "black", "затем", "темн", "чорн", "черн"],
  };
  const needles = variants[selected] || [selected.toLowerCase()];
  return needles.some((needle) => normalized.includes(needle));
}

export async function listProducts(opts: {
  category?: string;
  brand?: string;
  q?: string;
  sort?: string;
  min?: number;
  max?: number;
  lens?: string;
  antiFog?: string;
  photo?: string;
  polar?: string;
  rx?: string;
  interchangeable?: string;
  page?: number;
  take?: number;
  locale?: string;
}) {
  const take = opts.take ?? 12;
  const page = opts.page ?? 1;
  const start = (page - 1) * take;
  const where: Record<string, unknown> = { isActive: true };
  if (opts.category) {
    where.categories = { some: { category: { slug: opts.category } } };
  }
  if (opts.brand) where.brand = { slug: opts.brand };
  if (opts.min != null || opts.max != null) {
    where.retailPrice = {
      gte: opts.min ?? 0,
      lte: opts.max ?? 1_000_000,
    };
  }

  let orderBy: object = { popularity: "desc" };
  if (opts.sort === "cheap") orderBy = { retailPrice: "asc" };
  if (opts.sort === "expensive") orderBy = { retailPrice: "desc" };
  if (opts.sort === "new") orderBy = { createdAt: "desc" };
  if (opts.sort === "discount") orderBy = { discountPercent: "desc" };
  if (opts.sort === "name") orderBy = { sku: "asc" };

  const needsClientFiltering = Boolean(
    opts.q ||
      opts.lens ||
      opts.antiFog ||
      opts.photo ||
      opts.polar ||
      opts.rx ||
      opts.interchangeable,
  );
  const productQuery = {
    brand: { select: { name: true } },
    images: { orderBy: { sortOrder: "asc" as const }, take: 1, select: { url: true } },
  };

  if (!needsClientFiltering) {
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productQuery,
        orderBy,
        skip: start,
        take,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      items: items.map(toCard),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / take)),
    };
  }

  const all = await prisma.product.findMany({
    where,
    include: productQuery,
    orderBy,
  });

  const locale = opts.locale || "uk";
  const filtered = all.filter((p) => {
    const a = (p.attributes || {}) as Record<string, string>;
    if (!lensMatches(String(a.lensColor || ""), opts.lens)) return false;
    if (opts.antiFog === "yes" && !a.antiFog) return false;
    if (opts.photo === "yes" && a.photochromic !== "yes") return false;
    if (opts.polar === "yes" && a.polarized !== "yes") return false;
    if (opts.rx === "yes" && a.rxInsert !== "yes") return false;
    if (opts.interchangeable === "yes" && a.interchangeable !== "yes") return false;
    if (opts.q) {
      const n = tJson(p.name, locale).toLowerCase();
      const q = opts.q.toLowerCase();
      if (
        !n.includes(q) &&
        !p.sku.toLowerCase().includes(q) &&
        !p.supplierArticle.toLowerCase().includes(q) &&
        !(p.brand?.name.toLowerCase().includes(q))
      )
        return false;
    }
    return true;
  });

  return {
    items: filtered.slice(start, start + take).map(toCard),
    total: filtered.length,
    page,
    pages: Math.max(1, Math.ceil(filtered.length / take)),
  };
}
