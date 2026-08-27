import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";

export default async function Prices() {
  const products = await prisma.product.findMany({ take: 100, orderBy: { sku: "asc" } });
  return (
    <div>
      <h1 className="font-display text-2xl">Ціни</h1>
      <p className="mt-2 text-sm text-graphite/60">Пріоритет націнки: товар → бренд → категорія → глобальна (25%).</p>
      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="p-2">SKU</th>
            <th>Закуп</th>
            <th>МРЦ</th>
            <th>Роздріб</th>
            <th>Маржа</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="p-2">{p.sku}</td>
              <td>{formatPrice(p.supplierPrice)}</td>
              <td>{p.minimumRetailPrice}</td>
              <td>
                {formatPrice(p.retailPrice)}
                {p.minimumRetailPrice && p.retailPrice <= p.minimumRetailPrice && (
                  <span className="ml-2 text-accent">МРЦ</span>
                )}
              </td>
              <td>{p.retailPrice ? Math.round(((p.retailPrice - p.supplierPrice) / p.retailPrice) * 1000) / 10 : 0}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
