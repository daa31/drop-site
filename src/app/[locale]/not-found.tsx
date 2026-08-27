import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/ProductCard";
import { toCard } from "@/lib/catalog";

export default async function NotFound() {
  const t = await getTranslations("errors");
  const hits = await prisma.product.findMany({
    where: { isActive: true, isHit: true },
    include: { brand: true, images: { take: 1 } },
    take: 4,
  });
  return (
    <div className="container-f py-20 text-center">
      <h1 className="font-display text-3xl">{t("404")}</h1>
      <Link href="/catalog" className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-white">
        {t("back")}
      </Link>
      <div className="mt-12 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
        {hits.map((p) => (
          <ProductCard key={p.id} p={toCard(p)} locale="uk" />
        ))}
      </div>
    </div>
  );
}
