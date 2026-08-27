import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CookieBanner } from "@/components/CookieBanner";
import { Analytics } from "@/components/Analytics";
import { prisma } from "@/lib/db";
import { getCart } from "@/lib/cart";
import { getSession } from "@/lib/auth";
import { siteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "uk")) notFound();
  const messages = await getMessages();
  const [categories, cart, session, settings] = await Promise.all([
    prisma.category.findMany({
      where: { products: { some: { product: { isActive: true } } } },
      orderBy: { sortOrder: "asc" },
    }),
    getCart(),
    getSession(),
    siteSettings(),
  ]);

  return (
    <NextIntlClientProvider messages={messages}>
      <Header
        locale={locale}
        categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
        cartCount={cart.reduce((s, i) => s + i.qty, 0)}
        user={session}
      />
      <main className="min-h-[70vh]">{children}</main>
      <Footer locale={locale} settings={settings} />
      <CookieBanner />
      <Analytics
        ga={settings.ga_id || process.env.NEXT_PUBLIC_GA_ID}
        meta={settings.meta_pixel || process.env.NEXT_PUBLIC_META_PIXEL_ID}
        tiktok={settings.tiktok_pixel || process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID}
      />
    </NextIntlClientProvider>
  );
}
