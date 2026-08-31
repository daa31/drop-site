import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = z
    .object({
      email: z.string().trim().max(200).optional().nullable(),
      phone: z.string().trim().max(30).optional().nullable(),
      name: z.string().trim().min(1).max(100).optional(),
    })
    .safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const data: { email?: string | null; phone?: string | null; name?: string } = {};

  if ("email" in parsed.data) {
    const raw = parsed.data.email || "";
    if (raw) {
      const email = normalizeEmail(raw);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        return NextResponse.json({ error: "invalid_email" }, { status: 422 });
      }
      const taken = await prisma.user.findFirst({ where: { email, id: { not: session.uid } }, select: { id: true } });
      if (taken) return NextResponse.json({ error: "email_taken" }, { status: 409 });
      data.email = email;
    } else {
      data.email = null;
    }
  }

  if ("phone" in parsed.data) {
    const raw = parsed.data.phone || "";
    if (raw) {
      const digits = raw.replace(/\D/g, "");
      if (digits.length < 10) return NextResponse.json({ error: "invalid_phone" }, { status: 422 });
      data.phone = raw.replace(/\s+/g, " ").trim();
    } else {
      data.phone = null;
    }
  }

  if (parsed.data.name) data.name = parsed.data.name;

  if (Object.keys(data).length === 0) return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });

  const user = await prisma.user.update({
    where: { id: session.uid },
    data,
    select: { name: true, email: true, phone: true },
  });

  return NextResponse.json({ ok: true, user });
}