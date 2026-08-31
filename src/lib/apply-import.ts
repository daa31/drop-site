import { prisma } from "./db";
import { computeRetail, getPricingSettings } from "./pricing";
import { slugify } from "./utils";
import type { ImportRow } from "./import-parse";

export type ApplyOptions = {
  source: string;
  createMissing?: boolean;
  deactivateMissing?: boolean;
  pricesOnly?: boolean;
};

export async function applyImportRows(rows: ImportRow[], opts: ApplyOptions) {
  const settings = await getPricingSettings();
  const existing = await prisma.product.findMany({
    select: {
      id: true,
      sku: true,
      supplierArticle: true,
      retailPrice: true,
      supplierPrice: true,
      customRetailPrice: true,
      rrc: true,
      marginPctOverride: true,
      minimumRetailPrice: true,
    },
  });
  const bySku = new Map<string, (typeof existing)[number]>();
  for (const p of existing) {
    bySku.set(p.sku, p);
    bySku.set(p.supplierArticle, p);
  }

  let added = 0;
  let updated = 0;
  let priceChanged = 0;
  let oos = 0;
  let skipped = 0;

for (const row of rows) {
    const found = bySku.get(row.sku);
    const supplier = found?.supplierPrice ?? row.supplier_price ?? 0;
    const rrc = found?.rrc ?? null;
    const mrp = row.mrp ?? found?.minimumRetailPrice ?? null;
    const price = computeRetail({
      supplierPrice: supplier,
      defaultMargin: settings.defaultMargin,
      productMargin: found?.marginPctOverride,
      customRetail: found?.customRetailPrice,
      rrc,
      rounding: settings.rounding,
      mrp,
      oldPrice: row.old_price ?? null,
    });

    const stock = row.stock;
    const stockStatus =
      row.stock_status ||
      (stock != null ? (stock > 0 ? "in_stock" : "out_of_stock") : row.available === false ? "out_of_stock" : undefined);
    if (stockStatus === "out_of_stock") oos += 1;

    if (!found) {
      if (!opts.createMissing) {
        skipped += 1;
        continue;
      }
      const brand = row.brand
        ? await prisma.brand.upsert({
            where: { slug: slugify(row.brand) },
            update: {},
            create: {
              slug: slugify(row.brand),
              name: row.brand,
              description: { uk: row.brand, ru: row.brand, en: row.brand },
            },
          })
        : null;
      const normalizedCategories = normalizeCategories(row.category);
      const categories = [];
      for (const normalizedCategory of normalizedCategories) {
        categories.push(
          await prisma.category.upsert({
            where: { slug: normalizedCategory.slug },
            update: { name: normalizedCategory.name },
            create: {
              slug: normalizedCategory.slug,
              name: normalizedCategory.name,
              sortOrder: normalizedCategory.sortOrder,
            },
          }),
        );
      }
      const name = {
        uk: row.name_uk || row.sku,
        ru: row.name_ru || row.name_uk || row.sku,
        en: row.name_en || row.name_uk || row.sku,
      };
      const p = await prisma.product.create({
        data: {
          slug: slugify(`${row.brand || "item"}-${row.sku}`),
          sku: row.sku,
          supplierArticle: row.sku,
          brandId: brand?.id,
          name,
          shortDescription: rowShortDescription(row),
          description: rowDescription(row),
          attributes: rowAttributes(row),
          supplierPrice: supplier,
          retailPrice: price.retailPrice,
          oldPrice: price.oldPrice,
          minimumRetailPrice: mrp,
          discountPercent: price.discountPercent,
          stock: stock ?? 0,
          stockStatus: stockStatus || "in_stock",
          lastImportedAt: new Date(),
          images: rowImages(row).length
            ? { create: rowImages(row).map((url, sortOrder) => ({ url, sortOrder })) }
            : undefined,
          categories: categories.length ? { create: categories.map((category) => ({ categoryId: category.id })) } : undefined,
        },
      });
      bySku.set(row.sku, {
        id: p.id,
        sku: p.sku,
        supplierArticle: p.sku,
        retailPrice: p.retailPrice,
        supplierPrice: p.supplierPrice,
        customRetailPrice: p.customRetailPrice,
        rrc: p.rrc,
        marginPctOverride: p.marginPctOverride,
        minimumRetailPrice: p.minimumRetailPrice,
      });
      await prisma.priceHistory.create({
        data: { productId: p.id, oldPrice: 0, newPrice: price.retailPrice, source: opts.source },
      });
      added += 1;
      continue;
    }

    const data: Record<string, unknown> = {
      supplierPrice: supplier,
      retailPrice: price.retailPrice,
      oldPrice: price.oldPrice,
      minimumRetailPrice: mrp,
      discountPercent: price.discountPercent,
      missingFromFeed: false,
      isActive: true,
      lastImportedAt: new Date(),
    };
    if (stock != null) data.stock = stock;
    if (stockStatus) data.stockStatus = stockStatus;

    if (!opts.pricesOnly) {
      data.attributes = rowAttributes(row);
      const description = rowDescription(row);
      const shortDescription = rowShortDescription(row);
      if (description) data.description = description;
      if (shortDescription) data.shortDescription = shortDescription;
      if (rowImages(row).length) {
        data.images = {
          deleteMany: {},
          create: rowImages(row).map((url, sortOrder) => ({ url, sortOrder })),
        };
      }
    }

    if (found.retailPrice !== price.retailPrice || found.supplierPrice !== supplier) {
      priceChanged += 1;
      await prisma.priceHistory.create({
        data: {
          productId: found.id,
          oldPrice: found.retailPrice,
          newPrice: price.retailPrice,
          source: opts.source,
        },
      });
    }

    await prisma.product.update({ where: { id: found.id }, data });
    if (!opts.pricesOnly) {
      const normalizedCategories = normalizeCategories(row.category);
      for (const normalizedCategory of normalizedCategories) {
        const category = await prisma.category.upsert({
          where: { slug: normalizedCategory.slug },
          update: { name: normalizedCategory.name },
          create: {
            slug: normalizedCategory.slug,
            name: normalizedCategory.name,
            sortOrder: normalizedCategory.sortOrder,
          },
        });
        await prisma.productCategory.upsert({
          where: { productId_categoryId: { productId: found.id, categoryId: category.id } },
          update: {},
          create: { productId: found.id, categoryId: category.id },
        });
      }
    }
    updated += 1;
  }

  let missing = 0;
  if (opts.deactivateMissing) {
    const incoming = new Set(rows.map((r) => r.sku));
    const gone = existing.filter((p) => !incoming.has(p.sku) && !incoming.has(p.supplierArticle));
    missing = gone.length;
    if (gone.length) {
      await prisma.product.updateMany({
        where: { id: { in: gone.map((p) => p.id) } },
        data: { isActive: false, missingFromFeed: true },
      });
    }
  }

  return {
    imported: rows.length,
    updated,
    added,
    priceChanged,
    oos,
    skipped,
    missing,
    errors: 0,
  };
}

function rowAttributes(row: ImportRow) {
  return {
    lensColor: row.lens_color || undefined,
    frameColor: row.frame_color || undefined,
    antiFog: row.anti_fog || undefined,
    polarized: row.polarized || undefined,
    photochromic: row.photochromic || undefined,
    interchangeable: row.interchangeable || undefined,
    rxInsert: row.rx_insert || undefined,
    uv: row.uv || undefined,
  };
}

function rowImages(row: ImportRow) {
  return Array.from(new Set([...(row.images || []), row.image].filter(Boolean) as string[]));
}

function rowDescription(row: ImportRow) {
  const uk = row.description_uk || "";
  const ru = row.description_ru || uk;
  const en = row.name_en ? "" : uk;
  return uk || ru ? { uk, ru, en } : undefined;
}

function rowShortDescription(row: ImportRow) {
  const description = rowDescription(row);
  if (!description) return undefined;
  return {
    uk: description.uk.slice(0, 260),
    ru: description.ru.slice(0, 260),
    en: description.en.slice(0, 260),
  };
}

function normalizeCategories(category?: string): Array<{
  slug: string;
  name: { uk: string; ru: string; en: string };
  sortOrder: number;
}> {
  const raw = (category || "").trim();
  if (!raw) return [];
  const normalized = raw.toLowerCase();
  const other = {
    slug: "inshi-tovary",
    name: { uk: "Інше", ru: "Другое", en: "Other" },
    sortOrder: 900,
  };
  if (["інші товари", "другие товары", "other products"].includes(normalized)) return [other];
  if (["перчатки", "рукавиці", "рукавицы", "gloves"].includes(normalized)) {
    return [
      {
        slug: "rukavytsi",
        name: { uk: "Рукавиці", ru: "Перчатки", en: "Gloves" },
        sortOrder: 1000,
      },
    ];
  }
  const direct: Record<string, { slug: string; name: { uk: string; ru: string; en: string }; sortOrder: number }> = {
    "очки защитные открытые": {
      slug: "zakhysni-okuliary",
      name: { uk: "Захисні окуляри", ru: "Защитные очки", en: "Safety glasses" },
      sortOrder: 0,
    },
    "очки защитные с уплотнителем": {
      slug: "okuliary-z-ushchilniuachem",
      name: { uk: "Окуляри з ущільнювачем", ru: "Очки с уплотнителем", en: "Sealed eyewear" },
      sortOrder: 1,
    },
    "очки защитные со сменными линзами": {
      slug: "zi-zminnymy-linzamy",
      name: { uk: "Окуляри зі змінними лінзами", ru: "Очки со сменными линзами", en: "Interchangeable lenses" },
      sortOrder: 2,
    },
    "очки защитные фотохромные": {
      slug: "fotokhromni-okuliary",
      name: { uk: "Фотохромні окуляри", ru: "Фотохромные очки", en: "Photochromic glasses" },
      sortOrder: 3,
    },
    "очки поляризационные": {
      slug: "poliaryzatsiini-okuliary",
      name: { uk: "Поляризаційні окуляри", ru: "Поляризационные очки", en: "Polarized glasses" },
      sortOrder: 4,
    },
    "очки поляризационные защитные 2в1": {
      slug: "poliaryzatsiini-okuliary",
      name: { uk: "Поляризаційні окуляри", ru: "Поляризационные очки", en: "Polarized glasses" },
      sortOrder: 4,
    },
    "антифары": {
      slug: "okuliary-dlia-vodiiv",
      name: { uk: "Окуляри для водіїв", ru: "Очки для водителей", en: "Driver glasses" },
      sortOrder: 5,
    },
    "бифокальные защитные очки": {
      slug: "dioptrychni-rishennia",
      name: { uk: "Діоптричні окуляри", ru: "Диоптрические очки", en: "Rx-ready glasses" },
      sortOrder: 6,
    },
    "бифокальные поляризационные очки": {
      slug: "dioptrychni-rishennia",
      name: { uk: "Діоптричні окуляри", ru: "Диоптрические очки", en: "Rx-ready glasses" },
      sortOrder: 6,
    },
    "бифокальные поляризационные защитные очки 3в1": {
      slug: "dioptrychni-rishennia",
      name: { uk: "Діоптричні окуляри", ru: "Диоптрические очки", en: "Rx-ready glasses" },
      sortOrder: 6,
    },
    "бифокальные фотохромные защитные очки": {
      slug: "dioptrychni-rishennia",
      name: { uk: "Діоптричні окуляри", ru: "Диоптрические очки", en: "Rx-ready glasses" },
      sortOrder: 6,
    },
    "спортивные оправы под диоптрии": {
      slug: "dioptrychni-rishennia",
      name: { uk: "Діоптричні окуляри", ru: "Диоптрические очки", en: "Rx-ready glasses" },
      sortOrder: 6,
    },
    "диоптрические вставки для очков": {
      slug: "dioptrychni-rishennia",
      name: { uk: "Діоптричні окуляри", ru: "Диоптрические очки", en: "Rx-ready glasses" },
      sortOrder: 6,
    },
    "поляризационные накладки на очки": {
      slug: "dioptrychni-rishennia",
      name: { uk: "Діоптричні окуляри", ru: "Диоптрические очки", en: "Rx-ready glasses" },
      sortOrder: 6,
    },
    "защита слуха": {
      slug: "zakhyst-slukhu",
      name: { uk: "Захист слуху", ru: "Защита слуха", en: "Hearing protection" },
      sortOrder: 8,
    },
    "захист слуху": {
      slug: "zakhyst-slukhu",
      name: { uk: "Захист слуху", ru: "Защита слуха", en: "Hearing protection" },
      sortOrder: 8,
    },
    "аксессуары для очков": {
      slug: "aksesuary",
      name: { uk: "Аксесуари для окулярів", ru: "Аксессуары для очков", en: "Eyewear accessories" },
      sortOrder: 10,
    },
    "аксесуари для окулярів": {
      slug: "aksesuary",
      name: { uk: "Аксесуари для окулярів", ru: "Аксессуары для очков", en: "Eyewear accessories" },
      sortOrder: 10,
    },
    "средства для ухода за очками": {
      slug: "zasoby-dlia-dohliadu-za-okuliaramy",
      name: { uk: "Засоби для догляду за окулярами", ru: "Средства для ухода за очками", en: "Eyewear care" },
      sortOrder: 11,
    },
    "засоби для догляду за окулярами": {
      slug: "zasoby-dlia-dohliadu-za-okuliaramy",
      name: { uk: "Засоби для догляду за окулярами", ru: "Средства для ухода за очками", en: "Eyewear care" },
      sortOrder: 11,
    },
    "ремешки и крепления для очков": {
      slug: "rementsi-ta-kriplennia-dlia-okuliariv",
      name: { uk: "Ремінці та кріплення для окулярів", ru: "Ремешки и крепления для очков", en: "Straps and holders" },
      sortOrder: 12,
    },
    "ремінці та кріплення для окулярів": {
      slug: "rementsi-ta-kriplennia-dlia-okuliariv",
      name: { uk: "Ремінці та кріплення для окулярів", ru: "Ремешки и крепления для очков", en: "Straps and holders" },
      sortOrder: 12,
    },
    "футляры, чехлы и мешочки для очков": {
      slug: "futliary-chokhly-ta-mishechky-dlia-okuliariv",
      name: { uk: "Футляри, чохли та мішечки для окулярів", ru: "Футляры, чехлы и мешочки для очков", en: "Cases and pouches" },
      sortOrder: 13,
    },
    "футляри, чохли та мішечки для окулярів": {
      slug: "futliary-chokhly-ta-mishechky-dlia-okuliariv",
      name: { uk: "Футляри, чохли та мішечки для окулярів", ru: "Футляры, чехлы и мешочки для очков", en: "Cases and pouches" },
      sortOrder: 13,
    },
  };
  if (direct[normalized]) return [direct[normalized]];
  if (["торгівельне обладнання", "торговое оборудование"].includes(normalized)) {
    return [
      other,
      {
        slug: "torhovoe-oborudovanye",
        name: { uk: "Торгове обладнання", ru: "Торговое оборудование", en: "Retail equipment" },
        sortOrder: 901,
      },
    ];
  }
  if (
    [
      "аксесуари для охолодження і захист від сонця",
      "аксессуары для охлаждения и защита от солнца",
      "аксессуары для охлаждения и защиты от солнца",
      "аксесуари для охолодження та захисту від сонця",
    ].includes(normalized)
  ) {
    return [
      other,
      {
        slug: "aksessuary-dlia-okhlazhdenyia-y-zashchyta-ot-solntsa",
        name: {
          uk: "Аксесуари для охолодження та захисту від сонця",
          ru: "Аксессуары для охлаждения и защиты от солнца",
          en: "Cooling and sun protection accessories",
        },
        sortOrder: 902,
      },
    ];
  }
  const current = {
    slug: slugify(raw) || `category-${raw}`,
    name: { uk: raw, ru: raw, en: raw },
    sortOrder: 1000,
  };
  return [current];
}
