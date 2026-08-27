import { NextRequest, NextResponse } from "next/server";
import { listProducts } from "@/lib/catalog";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await listProducts({
    q: sp.get("q") || undefined,
    category: sp.get("category") || undefined,
    brand: sp.get("brand") || undefined,
    sort: sp.get("sort") || undefined,
    page: Number(sp.get("page") || 1),
    locale: sp.get("locale") || "uk",
  });
  return NextResponse.json(data);
}
