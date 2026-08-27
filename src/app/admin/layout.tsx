import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";

const NAV = [
  ["Dashboard", "/admin"],
  ["Товари", "/admin/products"],
  ["Категорії", "/admin/categories"],
  ["Замовлення", "/admin/orders"],
  ["Клієнти", "/admin/customers"],
  ["Імпорт", "/admin/import"],
  ["Ціни", "/admin/prices"],
  ["Залишки", "/admin/stock"],
  ["Бренди", "/admin/brands"],
  ["SEO", "/admin/seo"],
  ["Банери", "/admin/banners"],
  ["Налаштування", "/admin/settings"],
  ["Користувачі", "/admin/users"],
  ["Логи", "/admin/logs"],
  ["Відгуки", "/admin/reviews"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");
  return (
    <div className="flex min-h-screen bg-mist">
      <aside className="hidden w-56 shrink-0 border-r bg-white p-4 md:block">
        <div className="font-display tracking-[0.2em]">Locko</div>
        <nav className="mt-6 grid gap-1 text-sm">
          {NAV.map(([l, h]) => (
            <Link key={h} href={h} className="rounded-lg px-2 py-1.5 hover:bg-mist">
              {l}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 p-4 md:p-8">{children}</div>
    </div>
  );
}
