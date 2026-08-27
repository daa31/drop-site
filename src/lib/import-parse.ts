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
  available?: boolean;
  stock_status?: string;
  image?: string;
  images?: string[];
  description_uk?: string;
  description_ru?: string;
  lens_color?: string;
  frame_color?: string;
  anti_fog?: string;
  polarized?: string;
  photochromic?: string;
  interchangeable?: string;
  rx_insert?: string;
  uv?: string;
  source?: string;
};

export function parseImportFile(buffer: Buffer, filename: string): ImportRow[] {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".csv")) {
    const text = buffer.toString("utf8");
    const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
    return parsed.data.map(normalizeRow).filter((r) => r.sku);
  }
  if (lower.endsWith(".xml")) return parseYmlOffers(buffer.toString("utf8"));
  if (lower.endsWith(".xls") || lower.endsWith(".xlsx")) {
    const wb = XLSX.read(buffer, { type: "buffer" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);
    return rows.map(normalizeRow).filter((r) => r.sku);
  }
  throw new Error("Unsupported file type");
}

export function parseYmlOffers(xml: string, source = "yml"): ImportRow[] {
  const start = xml.search(/<yml_catalog|<shop|<offers/i);
  const xmlBody = start > 0 ? xml.slice(start) : xml;
  const parser = new XMLParser({
    ignoreAttributes: false,
    cdataPropName: "__cdata",
    isArray: (name) => ["category", "offer", "picture", "param"].includes(name),
  });
  const json = parser.parse(xmlBody);
  const categories = categoryMap(json.yml_catalog?.shop?.categories?.category);
  const items =
    json.yml_catalog?.shop?.offers?.offer ||
    json.products?.product ||
    json.catalog?.offer ||
    json.items?.item ||
    [];
  const arr = Array.isArray(items) ? items : [items];

  return arr
    .map((it: Record<string, unknown>) => {
      const sku = text(it.vendorCode ?? it.sku ?? it.article ?? it["@_id"]).trim();
      const pictures = Array.isArray(it.picture) ? it.picture.map(text).filter(Boolean) : [text(it.picture)].filter(Boolean);
      const available = String(it["@_available"] ?? it.available ?? "true") !== "false";
      const stockRaw = it.quantity_in_stock ?? it.stock ?? it.quantity;
      const stock = stockRaw != null && stockRaw !== "" ? num(stockRaw) : available ? undefined : 0;
      const params = paramsMap(it.param);
      const categoryId = text(it.categoryId ?? it.category);
      const descriptionUk = cleanDescription(text(it.description_ua ?? it.description_uk));
      const descriptionRu = cleanDescription(text(it.description));

      return {
        sku,
        name_uk: text(it.name_ua ?? it.name_uk) || text(it.name),
        name_ru: text(it.name) || text(it.name_ua),
        name_en: "",
        brand: text(it.vendor ?? it.brand),
        category: categories.get(categoryId) || categoryId,
        supplier_price: num(it.price),
        old_price: num(it.oldprice ?? it.old_price),
        mrp: num(it.price),
        stock,
        available,
        stock_status: available && (stock == null || stock > 0) ? "in_stock" : "out_of_stock",
        image: pictures[0],
        images: pictures,
        description_uk: descriptionUk,
        description_ru: descriptionRu || descriptionUk,
        lens_color: getParam(params, ["\u0446\u0432\u0435\u0442 \u043b\u0438\u043d\u0437", "\u043a\u043e\u043b\u0456\u0440 \u043b\u0456\u043d\u0437"]),
        frame_color: getParam(params, ["\u0446\u0432\u0435\u0442 \u043e\u043f\u0440\u0430\u0432\u044b", "\u043a\u043e\u043b\u0456\u0440 \u043e\u043f\u0440\u0430\u0432\u0438", "\u0442\u0438\u043f \u043e\u043f\u0440\u0430\u0432\u044b"]),
        anti_fog: hasParam(params, ["\u0437\u0430\u0449\u0438\u0442\u0430 \u043e\u0442 \u0437\u0430\u043f\u043e\u0442\u0435\u0432\u0430\u043d\u0438\u044f", "\u0437\u0430\u0445\u0438\u0441\u0442 \u0432\u0456\u0434 \u0437\u0430\u043f\u043e\u0442\u0456\u0432\u0430\u043d\u043d\u044f"], ["anti-fog", "antifog", "h2max"]) ? "yes" : "",
        polarized: hasParam(params, ["\u043f\u043e\u043b\u044f\u0440\u0438\u0437\u0430\u0446\u0438\u044f", "\u043f\u043e\u043b\u044f\u0440\u0438\u0437\u0430\u0446\u0456\u044f", "\u0442\u0438\u043f \u043b\u0438\u043d\u0437\u044b", "\u0442\u0438\u043f \u043b\u0456\u043d\u0437\u0438"], ["\u043f\u043e\u043b\u044f\u0440", "polar"]) ? "yes" : "",
        photochromic: hasParam(params, ["\u0444\u043e\u0442\u043e\u0445\u0440\u043e\u043c", "\u0442\u0438\u043f \u043b\u0438\u043d\u0437\u044b", "\u0442\u0438\u043f \u043b\u0456\u043d\u0437\u0438"], ["\u0444\u043e\u0442\u043e\u0445\u0440\u043e\u043c", "photochrom"]) ? "yes" : "",
        interchangeable: hasParam(params, ["\u0441\u043c\u0435\u043d\u043d\u044b\u0435 \u043b\u0438\u043d\u0437\u044b", "\u0437\u043c\u0456\u043d\u043d\u0456 \u043b\u0456\u043d\u0437\u0438"], ["\u0434\u0430", "\u0442\u0430\u043a", "yes"]) ? "yes" : "",
        rx_insert: hasParam(params, ["\u0434\u0438\u043e\u043f\u0442\u0440", "\u0434\u0456\u043e\u043f\u0442\u0440"], ["\u0434\u0430", "\u0442\u0430\u043a", "yes"]) ? "yes" : "",
        uv: getParam(params, ["\u0437\u0430\u0449\u0438\u0442\u0430 \u043e\u0442 \u0443\u043b\u044c\u0442\u0440\u0430\u0444\u0438\u043e\u043b\u0435\u0442\u0430", "\u0437\u0430\u0445\u0438\u0441\u0442 \u0432\u0456\u0434 \u0443\u043b\u044c\u0442\u0440\u0430\u0444\u0456\u043e\u043b\u0435\u0442\u0443"]),
        source,
      } satisfies ImportRow;
    })
    .filter((r) => r.sku);
}

function categoryMap(value: unknown) {
  const rows = Array.isArray(value) ? value : value ? [value] : [];
  const map = new Map<string, string>();
  for (const row of rows) {
    const obj = row as Record<string, unknown>;
    const id = text(obj["@_id"] ?? obj.id);
    const name = text(obj["#text"] ?? obj.__cdata ?? obj.name);
    if (id && name) map.set(id, name);
  }
  return map;
}

function paramsMap(value: unknown) {
  const rows = Array.isArray(value) ? value : value ? [value] : [];
  const map: Record<string, string> = {};
  for (const row of rows) {
    const obj = row as Record<string, unknown>;
    const key = text(obj["@_name"] ?? obj.name).toLowerCase();
    const val = text(obj["#text"] ?? obj.__cdata ?? obj.value);
    if (key && val) map[key] = val;
  }
  return map;
}

function hasParam(params: Record<string, string>, keyNeedles: string[], valueNeedles: string[]) {
  return Object.entries(params).some(([key, value]) => {
    const k = key.toLowerCase();
    const v = value.toLowerCase();
    return keyNeedles.some((needle) => k.includes(needle)) && valueNeedles.some((needle) => v.includes(needle));
  });
}

function getParam(params: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = params[key];
    if (value) return value;
  }
  return "";
}

function text(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v).trim();
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (o.__cdata != null) return text(o.__cdata);
    if (o["#text"] != null) return text(o["#text"]);
  }
  return "";
}

function num(v: unknown): number | undefined {
  const n = Number(String(v ?? "").replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

function normalizeRow(row: Record<string, string | number | undefined>): ImportRow {
  const g = (k: string) => {
    const key = Object.keys(row).find((x) => x.toLowerCase().replace(/\s/g, "_") === k);
    return key != null ? row[key] : undefined;
  };
  return {
    sku: String(g("sku") ?? g("article") ?? g("\u0430\u0440\u0442\u0438\u043a\u0443\u043b") ?? "").trim(),
    name_uk: String(g("name_uk") ?? g("name") ?? g("\u043d\u0430\u0437\u0432\u0430") ?? g("\u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435") ?? ""),
    name_ru: String(g("name_ru") ?? ""),
    name_en: String(g("name_en") ?? ""),
    brand: String(g("brand") ?? g("\u0431\u0440\u0435\u043d\u0434") ?? ""),
    category: String(g("category") ?? g("\u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0456\u044f") ?? g("\u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044f") ?? ""),
    supplier_price: num(g("supplier_price") ?? g("price") ?? g("\u0446\u0456\u043d\u0430") ?? g("\u0446\u0435\u043d\u0430")),
    old_price: num(g("old_price") ?? g("oldprice") ?? g("\u0441\u0442\u0430\u0440\u0430_\u0446\u0456\u043d\u0430") ?? g("\u0441\u0442\u0430\u0440\u0430\u044f_\u0446\u0435\u043d\u0430")),
    mrp: num(g("mrp") ?? g("minimum_retail_price") ?? g("\u043c\u0440\u0446")),
    stock: num(g("stock") ?? g("qty") ?? g("\u0437\u0430\u043b\u0438\u0448\u043e\u043a") ?? g("\u043e\u0441\u0442\u0430\u0442\u043e\u043a")),
    stock_status: String(g("stock_status") ?? ""),
    image: String(g("image") ?? g("photo") ?? g("\u0444\u043e\u0442\u043e") ?? ""),
    description_uk: String(g("description_uk") ?? g("description_ua") ?? g("\u043e\u043f\u0438\u0441") ?? ""),
    description_ru: String(g("description_ru") ?? g("description") ?? g("\u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0435") ?? ""),
    lens_color: String(g("lens_color") ?? g("\u043a\u043e\u043b\u0456\u0440_\u043b\u0456\u043d\u0437") ?? g("\u0446\u0432\u0435\u0442_\u043b\u0438\u043d\u0437") ?? ""),
    frame_color: String(g("frame_color") ?? g("\u043a\u043e\u043b\u0456\u0440_\u043e\u043f\u0440\u0430\u0432\u0438") ?? g("\u0446\u0432\u0435\u0442_\u043e\u043f\u0440\u0430\u0432\u044b") ?? ""),
    anti_fog: String(g("anti_fog") ?? g("\u0430\u043d\u0442\u0438\u0437\u0430\u043f\u043e\u0442\u0456\u0432\u0430\u043d\u043d\u044f") ?? g("\u0430\u043d\u0442\u0438\u0437\u0430\u043f\u043e\u0442\u0435\u0432\u0430\u043d\u0438\u0435") ?? ""),
    polarized: String(g("polarized") ?? g("\u043f\u043e\u043b\u044f\u0440\u0438\u0437\u0430\u0446\u0456\u044f") ?? g("\u043f\u043e\u043b\u044f\u0440\u0438\u0437\u0430\u0446\u0438\u044f") ?? ""),
    photochromic: String(g("photochromic") ?? g("\u0444\u043e\u0442\u043e\u0445\u0440\u043e\u043c") ?? ""),
    interchangeable: String(g("interchangeable") ?? g("\u0437\u043c\u0456\u043d\u043d\u0456_\u043b\u0456\u043d\u0437\u0438") ?? g("\u0441\u043c\u0435\u043d\u043d\u044b\u0435_\u043b\u0438\u043d\u0437\u044b") ?? ""),
    rx_insert: String(g("rx_insert") ?? g("\u0434\u0456\u043e\u043f\u0442\u0440\u0438\u0447\u043d\u0430_\u0432\u0441\u0442\u0430\u0432\u043a\u0430") ?? g("\u0434\u0438\u043e\u043f\u0442\u0440\u0438\u0447\u0435\u0441\u043a\u0430\u044f_\u0432\u0441\u0442\u0430\u0432\u043a\u0430") ?? ""),
    uv: String(g("uv") ?? g("\u0443\u043b\u044c\u0442\u0440\u0430\u0444\u0456\u043e\u043b\u0435\u0442") ?? g("\u0443\u043b\u044c\u0442\u0440\u0430\u0444\u0438\u043e\u043b\u0435\u0442") ?? ""),
  };
}

function cleanDescription(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
