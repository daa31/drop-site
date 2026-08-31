import { prisma } from "./db";
import { findSearchProductIds } from "./search";
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

function textValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(textValue).join(" ");
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).map(textValue).join(" ");
  return "";
}

function productText(product: {
  sku?: string | null;
  supplierArticle?: string | null;
  name?: unknown;
  shortDescription?: unknown;
  benefits?: unknown;
  description?: unknown;
  kit?: unknown;
  usage?: unknown;
  attributes?: unknown;
}) {
  return [
    product.sku,
    product.supplierArticle,
    textValue(product.name),
    textValue(product.shortDescription),
    textValue(product.benefits),
    textValue(product.description),
    textValue(product.kit),
    textValue(product.usage),
    textValue(product.attributes),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function truthyFeature(value: unknown) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return false;
  return !["0", "false", "no", "ні", "нет", "немає", "нету", "none", "n/a", "-"].includes(normalized);
}

function includesAny(text: string, needles: string[]) {
  return needles.some((needle) => text.includes(needle));
}

function rxTextMatches(text: string) {
  return /\brx(?:-able|-ready|\b)|\+rx|1rx/i.test(text) || includesAny(text, ["діоптр", "диоптр"]);
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
  sale?: string;
  page?: number;
  take?: number;
  locale?: string;
}) {
  const take = opts.take ?? 12;
  const page = opts.page ?? 1;
  const start = (page - 1) * take;
  const where: Record<string, unknown> = { isActive: true };
  if (opts.sale === "1") {
    where.oldPrice = { not: null };
  }
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
  if (opts.q?.trim()) {
    const q = opts.q.trim();
    const searchIds = await findSearchProductIds(q, 5000);
    const searchConditions: Record<string, unknown>[] = [
      { sku: { contains: q } },
      { supplierArticle: { contains: q } },
      { brand: { name: { contains: q } } },
    ];
    if (searchIds.length) searchConditions.push({ id: { in: searchIds } });
    where.OR = searchConditions;
  }

  let orderBy: object = { popularity: "desc" };
  if (opts.sort === "cheap") orderBy = { retailPrice: "asc" };
  if (opts.sort === "expensive") orderBy = { retailPrice: "desc" };
  if (opts.sort === "new") orderBy = { createdAt: "desc" };
  if (opts.sort === "discount") orderBy = { discountPercent: "desc" };
  if (opts.sort === "name") orderBy = { sku: "asc" };

  const needsClientFiltering = Boolean(
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

  const filtered = all.filter((p) => {
    const a = (p.attributes || {}) as Record<string, string>;
    const text = productText(p);
    if (!lensMatches(String(a.lensColor || ""), opts.lens)) return false;
    if (opts.antiFog === "yes" && !truthyFeature(a.antiFog) && !includesAny(text, ["anti-fog", "anti fog", "antifog", "h2max"])) return false;
    if (opts.photo === "yes" && !truthyFeature(a.photochromic) && !includesAny(text, ["фотохром", "photochrom"])) return false;
    if (opts.polar === "yes" && !truthyFeature(a.polarized) && !includesAny(text, ["поляризац", "поляризаці", "polarized", "polarization"])) return false;
    if (opts.rx === "yes" && !truthyFeature(a.rxInsert) && !rxTextMatches(text)) return false;
    if (opts.interchangeable === "yes" && !truthyFeature(a.interchangeable) && !includesAny(text, ["змінними лінзами", "сменными линзами", "interchangeable"])) return false;
    return true;
  });

  return {
    items: filtered.slice(start, start + take).map(toCard),
    total: filtered.length,
    page,
    pages: Math.max(1, Math.ceil(filtered.length / take)),
  };
}
