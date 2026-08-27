import { NextRequest, NextResponse } from "next/server";
import { syncFeedPrices } from "@/lib/feeds";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET || "";
  const sent = req.headers.get("authorization")?.replace("Bearer ", "") || req.nextUrl.searchParams.get("secret") || "";
  if (!secret || sent !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await syncFeedPrices({ apply: true, createMissing: false });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  return GET(req);
}
