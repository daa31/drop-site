import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { z } from "zod";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = z.object({ email: z.string().email(), password: z.string().min(6) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user) return NextResponse.json({ error: "Auth" }, { status: 401 });
  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Auth" }, { status: 401 });
  await createSession({ uid: user.id, email: user.email, role: user.role as "admin", name: user.name });
  return NextResponse.json({ ok: true, role: user.role });
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
