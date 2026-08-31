import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Save } from "lucide-react";
import { getAdminLocale } from "@/lib/admin-locale";
import { prisma } from "@/lib/db";
import { orderStatusClass, type Locale } from "@/lib/localization";
import { formatPrice, tJson } from "@/lib/utils";

const COPY = {
  title: { uk: "Ціни", ru: "Цены", en: "Prices" },
  subtitle: {
    uk: "Весь каталог: фото, наявність, закупівля, МРЦ, РРЦ і редагування роздрібної ціни.",
    ru: "Весь каталог: фото, наличие, закупка, МРЦ, РРЦ и редактирование розничной цены.",
    en: "Full catalog: image, stock, supplier cost, MRP, RRC and editable retail price.",
  },
  product: { uk: "Товар", ru: "Товар", en: "Product" },
  stock: { uk: "Наявність", ru: "Наличие", en: "Stock" },
  supplier: { uk: "Закупівля", ru: "Закупка", en: "Supplier cost" },
  mrp: { uk: "МРЦ", ru: "МРЦ", en: "MRP" },
  rrc: { uk: "РРЦ", ru: "РРЦ", en: "RRC" },
  retail: { uk: "Роздріб", ru: "Розница", en: "Retail" },
  margin: { uk: "Маржа", ru: "Маржа", en: "Margin" },
  save: { uk: "Зберегти", ru: "Сохранить", en: "Save" },
  saved: { uk: "Ціну збережено.", ru: "Цена сохранена.", en: "Price saved." },
  inStock: { uk: "В наявності", ru: "В наличии", en: "In stock" },
  out: { uk: "Немає", ru: "Нет", en: "Out" },
  items: { uk: "товарів", ru: "товаров", en: "products" },
};

function t(key: keyof typeof COPY, locale: Locale) {
  return COPY[key][locale];
}

function margin(retail: number, supplier: number) {
  return retail ? `${Math.round(((retail - supplier) / retail) * 1000) / 10}%` : "0%";
}

async function updatePrice(fd: FormData) {
  "use server";
  const id = String(fd.get("id") || "");
  const retailPrice = Number(fd.get("retailPrice"));
  if (!id || !Number.isFinite(retailPrice) || retailPrice < 0) redirect("/admin/prices?error=price");

  const product = await prisma.product.findUnique({ where: { id }, select: { retailPrice: true } });
  if (!product) redirect("/admin/prices?error=product");
  if (product.retailPrice !== retailPrice) {
    await prisma.$transaction([
      prisma.product.update({ where: { id }, data: { retailPrice, customRetailPrice: retailPrice } }),
      prisma.priceHistory.create({ data: { productId: id, oldPrice: product.retailPrice, newPrice: retailPrice, source: "admin" } }),
    ]);
  }
  redirect(`/admin/prices?saved=${id}`);
}

async function updateRrc(fd: FormData) {
  "use server";
  const id = String(fd.get("id") || "");
  const raw = String(fd.get("rrc") || "").trim();
  if (!id) redirect("/admin/prices?error=price");

  const product = await prisma.product.findUnique({ where: { id }, select: { retailPrice: true } });
  if (!product) redirect("/admin/prices?error=product");

  if (raw === "") {
    await prisma.product.update({ where: { id }, data: { rrc: null } });
  } else {
    const rrc = Number(raw);
    if (!Number.isFinite(rrc) || rrc <= 0) redirect("/admin/prices?error=price");
    await prisma.$transaction([
      prisma.product.update({
        where: { id },
        data: { rrc, retailPrice: rrc, customRetailPrice: null },
      }),
      prisma.priceHistory.create({
        data: { productId: id, oldPrice: product.retailPrice, newPrice: rrc, source: "rrc" },
      }),
    ]);
  }
  redirect(`/admin/prices?saved=${id}`);
}

export default async function Prices({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [locale, sp] = await Promise.all([getAdminLocale(), searchParams]);
  const products = await prisma.product.findMany({
    include: { brand: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    orderBy: [{ isActive: "desc" }, { sku: "asc" }],
  });

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-display text-3xl">{t("title", locale)}</h1>
        <p className="mt-1 text-sm text-graphite/60">{t("subtitle", locale)}</p>
        <p className="mt-2 text-xs text-graphite/45">{products.length} {t("items", locale)}</p>
        {sp.saved && <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{t("saved", locale)}</div>}
      </div>

      <section className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1240px] table-fixed text-sm">
            <thead className="bg-mist text-left text-xs uppercase tracking-wide text-graphite/45">
              <tr>
                <th className="w-[430px] px-5 py-3">{t("product", locale)}</th>
                <th className="w-[150px] px-4 py-3">{t("stock", locale)}</th>
                <th className="w-[130px] px-4 py-3">{t("supplier", locale)}</th>
                <th className="w-[110px] px-4 py-3">{t("mrp", locale)}</th>
                <th className="w-[100px] px-4 py-3">{t("rrc", locale)}</th>
                <th className="w-[190px] px-4 py-3">{t("retail", locale)}</th>
                <th className="w-[100px] px-4 py-3">{t("margin", locale)}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const inStock = product.stockStatus === "in_stock" && product.stock > 0;
                const image = product.images[0]?.url || null;
                return (
                  <tr key={product.id} className={`border-t border-black/5 align-middle ${inStock ? "" : "bg-zinc-100 text-graphite/55"}`}>
                    <td className="px-5 py-3">
                      <div className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-3">
                        <Link href={`/product/${product.slug}`} className={`relative grid h-14 w-14 place-items-center overflow-hidden rounded-lg bg-[#eef0ed] ${inStock ? "" : "grayscale opacity-70"}`}>
                          {image ? <Image src={image} alt="" fill sizes="56px" className="object-contain p-1.5" /> : <span className="text-[10px] font-semibold text-graphite/35">Locko</span>}
                        </Link>
                        <div className="min-w-0">
                          <Link href={`/product/${product.slug}`} className="line-clamp-2 font-medium underline-offset-4 hover:underline">
                            {tJson(product.name, locale)}
                          </Link>
                          <div className="mt-1 text-xs text-graphite/50">
                            {product.sku} · {product.brand?.name || "-"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs ${inStock ? "bg-emerald-50 text-emerald-700" : orderStatusClass("cancelled")}`}>
                        {inStock ? `${t("inStock", locale)} · ${product.stock}` : t("out", locale)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{formatPrice(product.supplierPrice, locale)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{product.minimumRetailPrice ? formatPrice(product.minimumRetailPrice, locale) : "-"}</td>
                    <td className="px-4 py-3">
                      <form action={updateRrc} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={product.id} />
                        <input
                          name="rrc"
                          type="number"
                          min="0"
                          step="1"
                          defaultValue={product.rrc ? Math.round(product.rrc) : ""}
                          placeholder="—"
                          className="h-10 w-24 rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-ink"
                        />
                        <button className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-white" aria-label={t("save", locale)} title={t("save", locale)}>
                          <Save size={16} />
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3">
                      <form action={updatePrice} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={product.id} />
                        <input
                          name="retailPrice"
                          type="number"
                          min="0"
                          step="1"
                          defaultValue={Math.round(product.retailPrice)}
                          className="h-10 w-24 rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-ink"
                        />
                        <button className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-white" aria-label={t("save", locale)} title={t("save", locale)}>
                          <Save size={16} />
                        </button>
                      </form>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{margin(product.retailPrice, product.supplierPrice)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
