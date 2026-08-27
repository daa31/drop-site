import { prisma } from "@/lib/db";

export default async function Brands() {
  const brands = await prisma.brand.findMany();
  return (
    <div>
      <h1 className="font-display text-2xl">Бренди</h1>
      <ul className="mt-6">
        {brands.map((b) => (
          <li key={b.id}>{b.name}</li>
        ))}
      </ul>
    </div>
  );
}
