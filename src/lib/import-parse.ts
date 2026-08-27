import { XMLParser } from "fast-xml-parser";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export type ImportRow = {
  sku: string;
  name_uk?: string;
  name_ru?: string;
  name_en?: string;
  brand?: string;
  category?: string;
  supplier_price?: number;
  old_price?: number;
  mrp?: number;
  stock?: number;
  stock_status?: string;
  image?: string;
  lens_color?: string;
  frame_color?: string;
  anti_fog?: string;
  polarized?: string;
  photochromic?: string;
  interchangeable?: string;
  rx_insert?: string;
  uv?: string;
};

export function parseImportFile(buffer: Buffer, filename: string): ImportRow[] {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".csv")) {
    const text = buffer.toString("utf8");
    const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
    return parsed.data.map(normalizeRow);
  }
  if (lower.endsWith(".xml")) {
    const parser = new XMLParser({ ignoreAttributes: false });
    const json = parser.parse(buffer.toString("utf8"));
    const items =
      json.products?.product ||
      json.catalog?.offer ||
      json.yml_catalog?.shop?.offers?.offer ||
      json.items?.item ||
      [];
    const arr = Array.isArray(items) ? items : [items];
    return arr.map((it: Record<string, unknown>) =>
      normalizeRow({
        sku: String(it.sku ?? it.article ?? it.vendorCode ?? it["@_id"] ?? ""),
        name_uk: String(it.name ?? it.name_uk ?? ""),
        brand: String(it.brand ?? it.vendor ?? ""),
        category: String(it.category ?? ""),
        supplier_price: String(it.price ?? it.supplier_price ?? ""),
        old_price: String(it.oldprice ?? it.old_price ?? ""),
        stock: String(it.stock ?? it.quantity ?? ""),
        image: String(it.image ?? it.picture ?? ""),
      }),
    );
  }
  if (lower.endsWith(".xls") || lower.endsWith(".xlsx")) {
    const wb = XLSX.read(buffer, { type: "buffer" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);
    return rows.map(normalizeRow);
  }
  throw new Error("Unsupported file type");
}

function normalizeRow(row: Record<string, string | number | undefined>): ImportRow {
  const g = (k: string) => {
    const key = Object.keys(row).find((x) => x.toLowerCase().replace(/\s/g, "_") === k);
    return key != null ? row[key] : undefined;
  };
  const num = (v: unknown) => {
    const n = Number(String(v ?? "").replace(",", ".").replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : undefined;
  };
  return {
    sku: String(g("sku") ?? g("article") ?? g("артикул") ?? "").trim(),
    name_uk: String(g("name_uk") ?? g("name") ?? g("назва") ?? ""),
    name_ru: String(g("name_ru") ?? ""),
    name_en: String(g("name_en") ?? ""),
    brand: String(g("brand") ?? g("бренд") ?? ""),
    category: String(g("category") ?? g("категорія") ?? ""),
    supplier_price: num(g("supplier_price") ?? g("price") ?? g("ціна")),
    old_price: num(g("old_price") ?? g("oldprice")),
    mrp: num(g("mrp") ?? g("minimum_retail_price")),
    stock: num(g("stock") ?? g("qty") ?? g("залишок")),
    stock_status: String(g("stock_status") ?? ""),
    image: String(g("image") ?? g("photo") ?? ""),
    lens_color: String(g("lens_color") ?? ""),
    frame_color: String(g("frame_color") ?? ""),
    anti_fog: String(g("anti_fog") ?? ""),
    polarized: String(g("polarized") ?? ""),
    photochromic: String(g("photochromic") ?? ""),
    interchangeable: String(g("interchangeable") ?? ""),
    rx_insert: String(g("rx_insert") ?? ""),
    uv: String(g("uv") ?? ""),
  };
}
