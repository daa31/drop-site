import { NextRequest, NextResponse } from "next/server";
import { listProducts } from "@/lib/catalog";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await listProducts({
    q: sp.get("q") || undefined,
    category: sp.get("category") || undefined,
    brand: sp.get("brand") || undefined,
    sort: sp.get("sort") || undefined,
    min: sp.get("min") ? Number(sp.get("min")) : undefined,
    max: sp.get("max") ? Number(sp.get("max")) : undefined,
    lens: sp.get("lens") || undefined,
    antiFog: sp.get("af") || undefined,
    photo: sp.get("photo") || undefined,
    polar: sp.get("polar") || undefined,
    rx: sp.get("rx") || undefined,
    interchangeable: sp.get("il") || undefined,
    page: Number(sp.get("page") || 1),
    locale: sp.get("locale") || "uk",
  });
  return NextResponse.json(data);
}
