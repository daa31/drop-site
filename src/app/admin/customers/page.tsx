import { prisma } from "@/lib/db";

export default async function Customers() {
  const customers = await prisma.customer.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div>
      <h1 className="font-display text-2xl">Клієнти</h1>
      <ul className="mt-6 text-sm">
        {customers.map((c) => (
          <li key={c.id} className="border-b py-2">
            {c.name} · {c.phone} · {c.email}
          </li>
        ))}
      </ul>
    </div>
  );
}
