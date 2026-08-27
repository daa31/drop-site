import { prisma } from "@/lib/db";

export default async function Seo() {
  const pages = await prisma.seoPage.findMany({ take: 50 });
  return (
    <div>
      <h1 className="font-display text-2xl">SEO</h1>
      <ul className="mt-6 text-sm">
        {pages.map((p) => (
          <li key={p.id} className="border-b py-2">
            {p.path}
          </li>
        ))}
      </ul>
    </div>
  );
}
