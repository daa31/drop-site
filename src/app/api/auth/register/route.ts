import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { z } from "zod";
import { isEmailIdentifier, isValidEmail, normalizeIdentifier } from "@/lib/user-identity";

export async function POST(req: NextRequest) {
  const parsed = z
    .object({
      identifier: z.string().min(3).max(80).optional(),
      email: z.string().min(3).max(80).optional(),
      name: z.string().min(2),
      phone: z.string().max(40).optional(),
      password: z.string().min(4),
      locale: z.string().min(2).max(5).default("uk"),
    })
    .safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const email = normalizeIdentifier(parsed.data.identifier || parsed.data.email || "");
  if (!email || !isEmailIdentifier(email) || !isValidEmail(email)) {
    return NextResponse.json({ error: "invalid_identifier" }, { status: 400 });
  }

  const exists = await prisma.user.findFirst({ where: { OR: [{ email }, { username: email }] } });
  if (exists) return NextResponse.json({ error: "exists" }, { status: 409 });

  try {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(parsed.data.password, 12),
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        role: "customer",
        locale: parsed.data.locale,
      },
    });
    await createSession({ uid: user.id, email: user.email || user.id, role: "customer", name: user.name });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
}