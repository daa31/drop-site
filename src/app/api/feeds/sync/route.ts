import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { syncFeedPrices } from "@/lib/feeds";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  try {
    const result = await syncFeedPrices({
      apply: body.apply === true,
      createMissing: body.createMissing === true,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "sync failed" }, { status: 502 });
  }
}
