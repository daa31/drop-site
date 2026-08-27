import { prisma } from "@/lib/db";
import { formatPrice, tJson } from "@/lib/utils";
import Link from "next/link";

export default async function AdminProducts() {
  const products = await prisma.product.findMany({ include: { brand: true }, orderBy: { updatedAt: "desc" }, take: 200 });
  return (
    <div>
      <h1 className="font-display text-2xl">Товари</h1>
      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-mist text-left">
            <tr>
              <th className="p-3">SKU</th>
              <th>Назва</th>
              <th>Закуп</th>
              <th>Роздріб</th>
              <th>МРЦ</th>
              <th>Сток</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">
                  <Link href={`/admin/products/${p.id}`} className="underline">
                    {p.sku}
                  </Link>
                </td>
                <td>{tJson(p.name, "uk")}</td>
                <td>{formatPrice(p.supplierPrice)}</td>
                <td>
                  {formatPrice(p.retailPrice)}
                  {p.minimumRetailPrice && p.retailPrice < p.minimumRetailPrice && (
                    <span className="ml-2 text-xs text-accent">нижче МРЦ</span>
                  )}
                </td>
                <td>{p.minimumRetailPrice}</td>
                <td>{p.stock}</td>
                <td>{p.isActive ? "active" : "off"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
