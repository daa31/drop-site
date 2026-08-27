import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/lib/search";
import { tJson } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  const locale = req.nextUrl.searchParams.get("locale") || "uk";
  const items = await searchProducts(q, locale, 8);
  return NextResponse.json({
    items: items.map((p) => ({
      slug: p.slug,
      sku: p.sku,
      name: tJson(p.name, locale),
    })),
  });
}
