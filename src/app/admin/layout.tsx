import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminLocale } from "@/lib/admin-locale";
import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [admin, locale] = await Promise.all([requireAdmin(), getAdminLocale()]);
  if (!admin) redirect("/login");
  return <AdminShell adminName={admin.name} locale={locale}>{children}</AdminShell>;
}
