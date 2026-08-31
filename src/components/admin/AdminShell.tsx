"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import {
  BarChart3,
  FileDown,
  Home,
  Languages,
  LayoutPanelTop,
  LogOut,
  PackageSearch,
  ReceiptText,
  Search,
  Settings,
  Tags,
  UserCog,
  Users,
} from "lucide-react";
import { ADMIN_NAV_COPY } from "@/lib/admin-copy";
import { ADMIN_LOCALE_COOKIE, LOCALE_LABELS, LOCALES, type Locale } from "@/lib/localization";

type NavItem = {
  labelKey: keyof typeof ADMIN_NAV_COPY;
  href: string;
  icon: ComponentType<{ size?: number; className?: string }>;
};

const CRM_NAV: NavItem[] = [
  { labelKey: "overview", href: "/admin", icon: Home },
  { labelKey: "orders", href: "/admin/orders", icon: ReceiptText },
  { labelKey: "customers", href: "/admin/customers", icon: Users },
  { labelKey: "products", href: "/admin/products", icon: PackageSearch },
];

const CATALOG_NAV: NavItem[] = [
  { labelKey: "brands", href: "/admin/brands", icon: Tags },
  { labelKey: "import", href: "/admin/import", icon: FileDown },
  { labelKey: "prices", href: "/admin/prices", icon: BarChart3 },
];

const SYSTEM_NAV: NavItem[] = [
  { labelKey: "users", href: "/admin/users", icon: UserCog },
  { labelKey: "banners", href: "/admin/banners", icon: LayoutPanelTop },
  { labelKey: "seo", href: "/admin/seo", icon: Search },
  { labelKey: "settings", href: "/admin/settings", icon: Settings },
];

const navGroups = [
  ["CRM", CRM_NAV],
  ["catalogGroup", CATALOG_NAV],
  ["siteGroup", SYSTEM_NAV],
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function label(key: keyof typeof ADMIN_NAV_COPY, locale: Locale) {
  return ADMIN_NAV_COPY[key][locale];
}

function setAdminLocale(locale: Locale) {
  document.cookie = `${ADMIN_LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  window.location.reload();
}

function LocaleSwitch({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  return (
    <div className={`grid grid-cols-3 gap-1 rounded-lg border border-black/10 bg-white p-1 ${compact ? "" : "w-full"}`}>
      {LOCALES.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setAdminLocale(item)}
          className={`h-8 rounded-md px-2 text-xs font-semibold ${item === locale ? "bg-ink text-white" : "text-graphite/60 hover:bg-mist"}`}
        >
          {LOCALE_LABELS[item]}
        </button>
      ))}
    </div>
  );
}

function NavLink({ item, locale }: { item: NavItem; locale: Locale }) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition ${
        active ? "bg-ink text-white" : "text-graphite/75 hover:bg-mist hover:text-ink"
      }`}
    >
      <Icon size={17} />
      <span className="truncate">{label(item.labelKey, locale)}</span>
    </Link>
  );
}

export function AdminShell({
  adminName,
  locale,
  children,
}: {
  adminName: string;
  locale: Locale;
  children: ReactNode;
}) {
  async function logout() {
    await fetch("/api/auth/login", { method: "DELETE" });
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-[#f3f4f2] text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-black/10 bg-white px-4 py-5 lg:flex">
        <Link href="/admin" className="flex h-11 items-center gap-3 rounded-lg px-2">
          <span className="grid h-9 w-9 place-items-center rounded bg-ink text-sm font-semibold text-white">L</span>
          <span>
            <span className="block font-display text-lg font-semibold tracking-[0.16em]">Locko</span>
            <span className="block text-xs text-graphite/55">CRM</span>
          </span>
        </Link>

        <nav className="mt-7 min-h-0 flex-1 overflow-y-auto pr-1">
          {navGroups.map(([title, items]) => (
            <section key={title} className="mb-6 last:mb-0">
              <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-graphite/40">
                {title === "CRM" ? "CRM" : label(title, locale)}
              </div>
              <div className="grid gap-1">
                {items.map((item) => (
                  <NavLink key={item.href} item={item} locale={locale} />
                ))}
              </div>
            </section>
          ))}
        </nav>

        <div className="mt-5 border-t border-black/10 pt-4">
          <div className="mb-4 px-3">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-graphite/40">
              <Languages size={14} />
              {label("language", locale)}
            </div>
            <LocaleSwitch locale={locale} />
          </div>
          <div className="px-3 text-sm font-medium">{adminName}</div>
          <button type="button" onClick={logout} className="mt-2 flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-graphite/70 hover:bg-mist">
            <LogOut size={17} />
            {label("logout", locale)}
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 border-b border-black/10 bg-[#f8f8f6]/95 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <Link href="/admin" className="font-display font-semibold tracking-[0.16em]">
              Locko CRM
            </Link>
            <div className="flex items-center gap-2">
              <LocaleSwitch locale={locale} compact />
              <button type="button" onClick={logout} className="grid h-10 w-10 place-items-center rounded-lg bg-white" aria-label={label("logout", locale)}>
                <LogOut size={18} />
              </button>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-4 pb-3 text-sm">
            {[...CRM_NAV, ...CATALOG_NAV, ...SYSTEM_NAV].map((item) => (
              <Link key={item.href} href={item.href} className="shrink-0 rounded-lg bg-white px-3 py-2">
                {label(item.labelKey, locale)}
              </Link>
            ))}
          </nav>
        </header>

        <main className="px-4 py-5 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
