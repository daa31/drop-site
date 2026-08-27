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

  const all = await prisma.product.findMany({
    where,
    include: { brand: true, images: { orderBy: { sortOrder: "asc" }, take: 1 }, categories: { include: { category: true } } },
    orderBy,
  });

  const locale = opts.locale || "uk";
  const filtered = all.filter((p) => {
    const a = (p.attributes || {}) as Record<string, string>;
    if (opts.lens && !String(a.lensColor || "").toLowerCase().includes(opts.lens.toLowerCase())) return false;
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

  const start = (page - 1) * take;
  return {
    items: filtered.slice(start, start + take).map(toCard),
    total: filtered.length,
    page,
    pages: Math.max(1, Math.ceil(filtered.length / take)),
  };
}
