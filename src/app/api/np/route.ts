import { NextRequest, NextResponse } from "next/server";
import { searchCities, searchWarehouses } from "@/lib/novaposhta";
import { siteSettings } from "@/lib/settings";

export async function GET(req: NextRequest) {
  const settings = await siteSettings();
  const key = process.env.NOVAPOSHTA_API_KEY || settings.np_api_key;
  const city = req.nextUrl.searchParams.get("city") || "";
  const cityRef = req.nextUrl.searchParams.get("cityRef") || "";
  const q = req.nextUrl.searchParams.get("q") || "";
  if (cityRef) {
    const warehouses = await searchWarehouses(key, cityRef, q);
    return NextResponse.json({ warehouses });
  }
  const cities = await searchCities(key, city);
  return NextResponse.json({ cities });
}
