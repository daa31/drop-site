import { prisma } from "@/lib/db";
import { tJson } from "@/lib/utils";

export default async function Banners() {
  const banners = await prisma.banner.findMany();
  return (
    <div>
      <h1 className="font-display text-2xl">Банери</h1>
      <ul className="mt-6">
        {banners.map((b) => (
          <li key={b.id}>
            {b.slot}: {tJson(b.title, "uk")}
          </li>
        ))}
      </ul>
    </div>
  );
}
