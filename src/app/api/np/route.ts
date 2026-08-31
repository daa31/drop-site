import { NextRequest, NextResponse } from "next/server";
import { searchCities, searchWarehouses } from "@/lib/novaposhta";
import { siteSettings } from "@/lib/settings";

export async function GET(req: NextRequest) {
  const settings = await siteSettings();
  const key = process.env.NOVAPOSHTA_API_KEY || settings.np_api_key;
  const city = req.nextUrl.searchParams.get("city") || "";
  const cityRef = req.nextUrl.searchParams.get("cityRef") || "";
  const q = req.nextUrl.searchParams.get("q") || "";
  const type = req.nextUrl.searchParams.get("type");
  if (cityRef) {
    const warehouseKind = type === "branch" || type === "locker" ? type : "all";
    const warehouses = await searchWarehouses(key, cityRef, q, warehouseKind);
    return NextResponse.json({ warehouses, configured: Boolean(key) });
  }
  const cities = await searchCities(key, city);
  return NextResponse.json({ cities, configured: Boolean(key) });
}
