import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { getCart } from "@/lib/cart";
import { formatPrice, tJson } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import { CartClient } from "@/components/CartClient";

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cart" });
  const items = await getCart();
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    include: { images: { take: 1 } },
  });
  const map = Object.fromEntries(products.map((p) => [p.id, p]));
  const rows = items
    .map((i) => {
      const p = map[i.productId];
      if (!p) return null;
      return {
        productId: i.productId,
        qty: i.qty,
        slug: p.slug,
        name: tJson(p.name, locale),
        price: p.retailPrice,
        image: p.images[0]?.url,
      };
    })
    .filter(Boolean) as { productId: string; qty: number; slug: string; name: string; price: number; image?: string }[];
  const total = rows.reduce((s, r) => s + r.price * r.qty, 0);

  if (!rows.length) {
    return (
      <div className="container-f py-20 text-center">
        <h1 className="font-display text-3xl">{t("title")}</h1>
        <p className="mt-3 text-graphite/60">{t("empty")}</p>
        <Link href="/catalog" className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-white">
          {t("toCatalog")}
        </Link>
      </div>
    );
  }

  return (
    <div className="container-f py-10">
      <h1 className="font-display text-3xl">{t("title")}</h1>
      <CartClient rows={rows} locale={locale} totalLabel={formatPrice(total, locale)} />
      <div className="mt-8 flex items-center justify-between rounded-2xl bg-white p-6 shadow-card">
        <div>
          <div className="text-sm text-graphite/60">{t("total")}</div>
          <div className="text-2xl font-semibold">{formatPrice(total, locale)}</div>
        </div>
        <Link href="/checkout" className="rounded-full bg-accent px-6 py-3 text-white">
          {t("checkout")}
        </Link>
      </div>
    </div>
  );
}
