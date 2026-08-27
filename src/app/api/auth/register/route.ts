import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { z } from "zod";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = z
    .object({ email: z.string().email(), password: z.string().min(8), name: z.string().min(2), phone: z.string().optional() })
    .safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (exists) return NextResponse.json({ error: "Exists" }, { status: 409 });
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      name: parsed.data.name,
      phone: parsed.data.phone,
      role: "customer",
    },
  });
  await createSession({ uid: user.id, email: user.email, role: "customer", name: user.name });
  return NextResponse.json({ ok: true });
}
