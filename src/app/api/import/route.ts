import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseImportFile } from "@/lib/import-parse";
import { applyImportRows } from "@/lib/apply-import";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const confirm = form.get("confirm") === "true";
  if (!file) return NextResponse.json({ error: "file" }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  const rows = parseImportFile(buf, file.name).filter((r) => r.sku);

  const existing = await prisma.product.findMany({ select: { sku: true, supplierArticle: true } });
  const known = new Set(existing.flatMap((p) => [p.sku, p.supplierArticle]));
  const preview = {
    added: rows.filter((r) => !known.has(r.sku)).length,
    updated: rows.filter((r) => known.has(r.sku)).length,
    missing: existing.filter((p) => !rows.some((r) => r.sku === p.sku || r.sku === p.supplierArticle)).length,
    rows: rows.slice(0, 40),
  };

  const job = await prisma.importJob.create({
    data: { filename: file.name, status: confirm ? "applied" : "preview", report: preview },
  });

  if (!confirm) return NextResponse.json({ preview, jobId: job.id });

  const report = await applyImportRows(rows, {
    source: "file",
    createMissing: true,
    deactivateMissing: true,
    pricesOnly: false,
  });
  await prisma.importJob.update({ where: { id: job.id }, data: { status: "done", report } });
  await prisma.importLog.create({ data: { importId: job.id, level: "info", message: JSON.stringify(report) } });
  return NextResponse.json({ report, jobId: job.id });
}
