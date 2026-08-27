import { prisma } from "@/lib/db";
import { tJson } from "@/lib/utils";

export default async function Categories() {
  const cats = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div>
      <h1 className="font-display text-2xl">Категорії</h1>
      <ul className="mt-6 space-y-2">
        {cats.map((c) => (
          <li key={c.id} className="rounded-xl bg-white p-3 shadow-card">
            {tJson(c.name, "uk")} · /{c.slug}
          </li>
        ))}
      </ul>
    </div>
  );
}
