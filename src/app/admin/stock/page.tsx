import { prisma } from "@/lib/db";

export default async function Stock() {
  const products = await prisma.product.findMany({ orderBy: { stock: "asc" } });
  return (
    <div>
      <h1 className="font-display text-2xl">Залишки</h1>
      <table className="mt-6 w-full text-sm">
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-2">{p.sku}</td>
              <td>{p.stock}</td>
              <td>{p.stockStatus}</td>
              <td>{p.missingFromFeed ? "немає у фіді" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
