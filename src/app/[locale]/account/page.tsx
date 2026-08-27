import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { formatPrice } from "@/lib/utils";

export default async function Account({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getSession();
  if (!session) redirect("/login");
  const orders = await prisma.order.findMany({
    where: { userId: session.uid },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="container-f py-10">
      <h1 className="font-display text-3xl">{session.name}</h1>
      <p className="mt-1 text-sm text-graphite/60">{session.email}</p>
      <h2 className="mt-10 font-medium">Замовлення</h2>
      <div className="mt-4 grid gap-3">
        {orders.length === 0 && <p className="text-sm text-graphite/60">Поки немає замовлень</p>}
        {orders.map((o) => (
          <div key={o.id} className="rounded-2xl bg-white p-5 shadow-card">
            <div className="flex justify-between">
              <span>№ {o.number}</span>
              <span>{o.status}</span>
            </div>
            <div className="mt-1 text-sm text-graphite/60">
              {formatPrice(o.total, locale)} {o.trackingNumber ? `· ТТН ${o.trackingNumber}` : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
