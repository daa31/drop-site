import { prisma } from "@/lib/db";
import { tJson } from "@/lib/utils";
import { Link } from "@/i18n/routing";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default async function Brands({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const brands = await prisma.brand.findMany();
  return (
    <div className="container-f py-10">
      <Breadcrumbs items={[{ href: "/", label: "FORTIS" }, { label: "Brands" }]} />
      <h1 className="font-display text-3xl">Бренди</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((b) => (
          <Link key={b.id} href={`/brands/${b.slug}`} className="rounded-2xl bg-white p-6 shadow-card">
            <div className="font-display text-xl">{b.name}</div>
            <p className="mt-2 text-sm text-graphite/70">{tJson(b.description, locale)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
