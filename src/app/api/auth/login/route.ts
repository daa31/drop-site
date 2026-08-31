import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { z } from "zod";
import { normalizeIdentifier } from "@/lib/user-identity";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = z
    .object({
      identifier: z.string().min(3).optional(),
      email: z.string().min(3).optional(),
      password: z.string().min(4),
    })
    .safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const identifier = normalizeIdentifier(parsed.data.identifier || parsed.data.email || "");
  if (!identifier) return NextResponse.json({ error: "invalid_identifier" }, { status: 400 });
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
  });
  if (!user) return NextResponse.json({ error: "Auth" }, { status: 401 });
  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Auth" }, { status: 401 });
  await createSession({ uid: user.id, email: user.email || user.username || user.id, role: user.role === "admin" ? "admin" : "customer", name: user.name });
  return NextResponse.json({ ok: true, role: user.role });
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
