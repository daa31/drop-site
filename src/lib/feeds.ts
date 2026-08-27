import { parseYmlOffers, type ImportRow } from "./import-parse";
import { siteSettings } from "./settings";
import { applyImportRows } from "./apply-import";
import { prisma } from "./db";

export const DEFAULT_UABEST_FEED =
  "https://uabest.com.ua/content/export/f3c3a6750fc5783821bd896ea6f5dba3.xml";

export const DEFAULT_PYRAMEX_FEED =
  "https://pyramex.prom.ua/products_feed.xml?hash_tag=1459a430d257d2f7076e1ad08d2fb397&sales_notes=&product_ids=&label_ids=&exclude_fields=&html_description=1&yandex_cpa=&process_presence_sure=&languages=uk%2Cru&group_ids=100547263%2C100547264%2C100547266%2C110964000%2C114098108%2C114098109%2C114098110%2C114098111%2C114098112%2C114098113%2C114098114&nested_group_ids=100547264%2C100547266%2C110964000%2C114098108%2C114098109%2C114098110%2C114098111%2C114098112%2C114098113%2C114098114";

async function fetchXml(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Locko-PriceSync/1.0",
      Accept: "application/xml,text/xml,*/*",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Feed ${url} returned ${res.status}`);
  return res.text();
}

function mergeFeeds(pyramex: ImportRow[], uabest: ImportRow[]) {
  const map = new Map<string, ImportRow>();
  for (const row of pyramex) {
    map.set(row.sku, { ...row, source: "pyramex" });
  }
  for (const row of uabest) {
    const prev = map.get(row.sku);
    map.set(row.sku, {
      ...prev,
      ...row,
      old_price: row.old_price ?? prev?.old_price,
      stock: row.stock ?? prev?.stock,
      image: prev?.image || row.image,
      name_uk: row.name_uk || prev?.name_uk,
      name_ru: row.name_ru || prev?.name_ru,
      source: prev ? "uabest+pyramex" : "uabest",
    });
  }
  return [...map.values()];
}

export async function loadMergedFeedRows() {
  const settings = await siteSettings();
  const uabestUrl = settings.feed_uabest_url || process.env.FEED_UABEST_URL || DEFAULT_UABEST_FEED;
  const pyramexUrl = settings.feed_pyramex_url || process.env.FEED_PYRAMEX_URL || DEFAULT_PYRAMEX_FEED;

  const errors: string[] = [];
  let uabest: ImportRow[] = [];
  let pyramex: ImportRow[] = [];

  try {
    uabest = parseYmlOffers(await fetchXml(uabestUrl), "uabest");
  } catch (e) {
    errors.push(`UAbest: ${e instanceof Error ? e.message : "fetch failed"}`);
  }
  try {
    pyramex = parseYmlOffers(await fetchXml(pyramexUrl), "pyramex");
  } catch (e) {
    errors.push(`Pyramex: ${e instanceof Error ? e.message : "fetch failed"}`);
  }

  const rows = mergeFeeds(pyramex, uabest);
  return {
    rows,
    uabestCount: uabest.length,
    pyramexCount: pyramex.length,
    errors,
    uabestUrl,
    pyramexUrl,
  };
}

export async function syncFeedPrices(opts: { apply: boolean; createMissing?: boolean }) {
  const loaded = await loadMergedFeedRows();
  const existing = await prisma.product.findMany({ select: { sku: true, supplierArticle: true, supplierPrice: true } });
  const known = new Set(existing.flatMap((p) => [p.sku, p.supplierArticle]));
  const matched = loaded.rows.filter((r) => known.has(r.sku));
  const newRows = loaded.rows.filter((r) => !known.has(r.sku));
  const priceDiffs = matched.filter((r) => {
    const p = existing.find((x) => x.sku === r.sku || x.supplierArticle === r.sku);
    return p && r.supplier_price != null && p.supplierPrice !== r.supplier_price;
  });

  const preview = {
    uabestOffers: loaded.uabestCount,
    pyramexOffers: loaded.pyramexCount,
    merged: loaded.rows.length,
    matched: matched.length,
    newInFeed: newRows.length,
    priceChanges: priceDiffs.length,
    sampleChanges: priceDiffs.slice(0, 20).map((r) => ({
      sku: r.sku,
      supplier_price: r.supplier_price,
      old_price: r.old_price,
      stock: r.stock,
      source: r.source,
    })),
    errors: loaded.errors,
  };

  const job = await prisma.importJob.create({
    data: {
      filename: "feeds:uabest+pyramex",
      status: opts.apply ? "applied" : "preview",
      report: preview,
    },
  });

  if (!opts.apply) return { preview, jobId: job.id };

  const report = await applyImportRows(loaded.rows, {
    source: "feed",
    pricesOnly: !opts.createMissing,
    createMissing: !!opts.createMissing,
    deactivateMissing: false,
  });

  await prisma.importJob.update({ where: { id: job.id }, data: { status: "done", report: { ...preview, ...report } } });
  await prisma.importLog.create({
    data: { importId: job.id, level: loaded.errors.length ? "warn" : "info", message: JSON.stringify(report) },
  });
  await prisma.setting.upsert({
    where: { key: "last_feed_sync_at" },
    update: { value: new Date().toISOString() },
    create: { key: "last_feed_sync_at", value: new Date().toISOString() },
  });

  return { report: { ...preview, ...report }, jobId: job.id };
}
