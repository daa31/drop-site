import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { tJson } from "@/lib/utils";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await prisma.product.findUnique({ where: { id }, include: { priceHistory: { orderBy: { createdAt: "desc" }, take: 10 } } });
  if (!p) notFound();
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl">{tJson(p.name, "uk")}</h1>
      <form
        className="mt-6 grid gap-3"
        action={async (fd) => {
          "use server";
          const retail = Number(fd.get("retailPrice"));
          const mrp = Number(fd.get("mrp"));
          await prisma.product.update({
            where: { id },
            data: {
              retailPrice: retail,
              customRetailPrice: retail,
              supplierPrice: Number(fd.get("supplierPrice")),
              minimumRetailPrice: mrp,
              stock: Number(fd.get("stock")),
              stockStatus: String(fd.get("stockStatus")),
              isActive: fd.get("isActive") === "on",
            },
          });
        }}
      >
        <label className="text-sm">
          Закуп
          <input name="supplierPrice" defaultValue={p.supplierPrice} className="mt-1 w-full rounded-xl border px-3 py-2" />
        </label>
        <label className="text-sm">
          Роздріб
          <input name="retailPrice" defaultValue={p.retailPrice} className="mt-1 w-full rounded-xl border px-3 py-2" />
        </label>
        {p.minimumRetailPrice && p.retailPrice < p.minimumRetailPrice && (
          <p className="text-sm text-accent">Ціна нижче допустимої МРЦ</p>
        )}
        <label className="text-sm">
          МРЦ
          <input name="mrp" defaultValue={p.minimumRetailPrice ?? ""} className="mt-1 w-full rounded-xl border px-3 py-2" />
        </label>
        <label className="text-sm">
          Залишок
          <input name="stock" defaultValue={p.stock} className="mt-1 w-full rounded-xl border px-3 py-2" />
        </label>
        <select name="stockStatus" defaultValue={p.stockStatus} className="rounded-xl border px-3 py-2">
          <option value="in_stock">В наявності</option>
          <option value="out_of_stock">Немає</option>
          <option value="preorder">Під замовлення</option>
          <option value="expected">Очікується</option>
        </select>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={p.isActive} /> Активний
        </label>
        <button className="rounded-full bg-ink py-2 text-white">Зберегти</button>
      </form>
      <h2 className="mt-10 font-medium">Історія цін</h2>
      <ul className="mt-3 text-sm">
        {p.priceHistory.map((h) => (
          <li key={h.id}>
            {h.createdAt.toISOString().slice(0, 10)} {h.oldPrice} → {h.newPrice} ({h.source})
          </li>
        ))}
      </ul>
    </div>
  );
}
