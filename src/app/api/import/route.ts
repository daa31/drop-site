import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseImportFile } from "@/lib/import-parse";
import { prisma } from "@/lib/db";
import { computeRetail, getPricingSettings } from "@/lib/pricing";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const confirm = form.get("confirm") === "true";
  if (!file) return NextResponse.json({ error: "file" }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  const rows = parseImportFile(buf, file.name).filter((r) => r.sku);
  const settings = await getPricingSettings();

  const existing = await prisma.product.findMany({ select: { id: true, sku: true, supplierArticle: true, retailPrice: true, supplierPrice: true } });
  const bySku = new Map(existing.map((p) => [p.sku, p]));
  const incoming = new Set(rows.map((r) => r.sku));

  const preview = {
    added: rows.filter((r) => !bySku.has(r.sku)).length,
    updated: rows.filter((r) => bySku.has(r.sku)).length,
    missing: existing.filter((p) => !incoming.has(p.sku)).length,
    rows: rows.slice(0, 40),
  };

  const job = await prisma.importJob.create({
    data: { filename: file.name, status: confirm ? "applied" : "preview", report: preview },
  });

  if (!confirm) return NextResponse.json({ preview, jobId: job.id });

  let added = 0,
    updated = 0,
    priceChanged = 0,
    oos = 0;

  for (const row of rows) {
    const brand = row.brand
      ? await prisma.brand.upsert({
          where: { slug: slugify(row.brand) },
          update: {},
          create: { slug: slugify(row.brand), name: row.brand, description: { uk: row.brand, ru: row.brand, en: row.brand } },
        })
      : null;
    const supplier = row.supplier_price || 0;
    const price = computeRetail({
      supplierPrice: supplier,
      defaultMargin: settings.defaultMargin,
      rounding: settings.rounding,
      mrp: row.mrp ?? supplier,
      oldPrice: row.old_price ?? null,
    });
    const found = bySku.get(row.sku);
    const stock = row.stock ?? 0;
    const stockStatus = stock > 0 ? "in_stock" : "out_of_stock";
    if (stock === 0) oos += 1;
    const name = {
      uk: row.name_uk || row.sku,
      ru: row.name_ru || row.name_uk || row.sku,
      en: row.name_en || row.name_uk || row.sku,
    };
    const attrs = {
      lensColor: row.lens_color,
      frameColor: row.frame_color,
      antiFog: row.anti_fog,
      polarized: row.polarized,
      photochromic: row.photochromic,
      interchangeable: row.interchangeable,
      rxInsert: row.rx_insert,
      uv: row.uv,
    };
    if (!found) {
      const p = await prisma.product.create({
        data: {
          slug: slugify(`${row.brand || "item"}-${row.sku}`),
          sku: row.sku,
          supplierArticle: row.sku,
          brandId: brand?.id,
          name,
          attributes: attrs,
          supplierPrice: supplier,
          retailPrice: price.retailPrice,
          oldPrice: price.oldPrice,
          minimumRetailPrice: row.mrp ?? supplier,
          discountPercent: price.discountPercent,
          stock,
          stockStatus,
          lastImportedAt: new Date(),
          images: row.image ? { create: [{ url: row.image }] } : undefined,
        },
      });
      await prisma.priceHistory.create({ data: { productId: p.id, oldPrice: 0, newPrice: price.retailPrice, source: "import" } });
      added += 1;
    } else {
      if (found.retailPrice !== price.retailPrice) {
        priceChanged += 1;
        await prisma.priceHistory.create({
          data: { productId: found.id, oldPrice: found.retailPrice, newPrice: price.retailPrice, source: "import" },
        });
      }
      await prisma.product.update({
        where: { id: found.id },
        data: {
          supplierPrice: supplier,
          retailPrice: price.retailPrice,
          oldPrice: price.oldPrice,
          minimumRetailPrice: row.mrp ?? supplier,
          discountPercent: price.discountPercent,
          stock,
          stockStatus,
          missingFromFeed: false,
          isActive: true,
          lastImportedAt: new Date(),
          attributes: attrs,
        },
      });
      updated += 1;
    }
  }

  const missingSkus = existing.filter((p) => !incoming.has(p.sku));
  await prisma.product.updateMany({
    where: { sku: { in: missingSkus.map((p) => p.sku) } },
    data: { isActive: false, missingFromFeed: true },
  });

  const report = { imported: rows.length, updated, added, priceChanged, oos, missing: missingSkus.length, errors: 0 };
  await prisma.importJob.update({ where: { id: job.id }, data: { status: "done", report } });
  await prisma.importLog.create({ data: { importId: job.id, level: "info", message: JSON.stringify(report) } });
  return NextResponse.json({ report, jobId: job.id });
}
