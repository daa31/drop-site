import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { destroySession, getSession } from "@/lib/auth";

export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (session.role === "admin") {
    return NextResponse.json({ error: "admin_protected" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.uid } });
  if (!user) {
    await destroySession();
    return NextResponse.json({ ok: true });
  }

  try {
    await prisma.$transaction([
      prisma.order.updateMany({ where: { userId: user.id }, data: { userId: null } }),
      prisma.review.updateMany({ where: { userId: user.id }, data: { userId: null } }),
      prisma.notification.deleteMany({ where: { userId: user.id } }),
      prisma.wishlist.deleteMany({ where: { userId: user.id } }),
      prisma.address.deleteMany({ where: { userId: user.id } }),
      prisma.verificationCode.deleteMany({ where: { email: user.email || "none" } }),
      prisma.user.delete({ where: { id: user.id } }),
    ]);
  } catch {
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }

  await destroySession();
  return NextResponse.json({ ok: true });
}