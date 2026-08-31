import { redirect } from "next/navigation";
import { ADMIN_COMMON_COPY, ADMIN_SETTINGS_COPY } from "@/lib/admin-copy";
import { getAdminLocale } from "@/lib/admin-locale";
import { prisma } from "@/lib/db";
import { sendTestEmail } from "@/lib/email";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { type Locale } from "@/lib/localization";

const EMAIL_FIELDS = [
  ["order_notification_email", { uk: "Email для нових замовлень", ru: "Email для новых заказов", en: "New order email" }, "email"],
  ["smtp_host", { uk: "SMTP host", ru: "SMTP host", en: "SMTP host" }, "text"],
  ["smtp_port", { uk: "SMTP port", ru: "SMTP port", en: "SMTP port" }, "number"],
  ["smtp_secure", { uk: "SMTP secure", ru: "SMTP secure", en: "SMTP secure" }, "text"],
  ["smtp_user", { uk: "SMTP user", ru: "SMTP user", en: "SMTP user" }, "text"],
  ["smtp_pass", { uk: "SMTP password", ru: "SMTP password", en: "SMTP password" }, "password"],
  ["smtp_from", { uk: "SMTP from", ru: "SMTP from", en: "SMTP from" }, "text"],
  ["resend_api_key", { uk: "Resend API key", ru: "Resend API key", en: "Resend API key" }, "password"],
  ["resend_from", { uk: "Resend from (підтверджений домен)", ru: "Resend from (подтверждённый домен)", en: "Resend from (verified domain)" }, "text"],
] as const;

function t(key: keyof typeof ADMIN_SETTINGS_COPY, locale: Locale) {
  return ADMIN_SETTINGS_COPY[key][locale];
}

function c(key: keyof typeof ADMIN_COMMON_COPY, locale: Locale) {
  return ADMIN_COMMON_COPY[key][locale];
}

function formSettings(fd: FormData, keys: string[]) {
  return Object.fromEntries(keys.map((key) => [key, String(fd.get(key) ?? "")]));
}

async function persistSettings(settings: Record<string, string>) {
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [sp, locale, rows, lastMail] = await Promise.all([
    searchParams,
    getAdminLocale(),
    prisma.setting.findMany(),
    prisma.notification.findFirst({ where: { channel: "email" }, orderBy: { createdAt: "desc" } }),
  ]);
  const map = { ...DEFAULT_SETTINGS, ...Object.fromEntries(rows.map((r) => [r.key, r.value])) };
  const keys = Object.keys(map);
  const emailKeys = new Set<string>(EMAIL_FIELDS.map(([key]) => key));
  const otherSettings = Object.entries(map).filter(([key]) => !emailKeys.has(key));
  const mailStatus = typeof sp.mail === "string" ? sp.mail : "";

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl">{t("title", locale)}</h1>
      {sp.saved && <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{t("saved", locale)}</div>}
      {mailStatus && (
        <div className={`mt-4 rounded-lg p-3 text-sm ${mailStatus === "sent" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
          <div>{mailStatus === "sent" ? t("testSent", locale) : t("testFailed", locale)}</div>
          {lastMail?.body && <div className="mt-1 text-xs opacity-80">{lastMail.body}</div>}
        </div>
      )}
      <form
        className="mt-6 grid gap-6"
        action={async (fd) => {
          "use server";
          await persistSettings(formSettings(fd, keys));
          redirect("/admin/settings?saved=1");
        }}
      >
        <section className="rounded-lg bg-white p-5 shadow-card">
          <h2 className="font-medium">{t("emailTitle", locale)}</h2>
          <p className="mt-1 text-sm text-graphite/60">{t("emailText", locale)}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {EMAIL_FIELDS.map(([key, label, type]) => (
              <label key={key} className={key === "order_notification_email" ? "text-sm sm:col-span-2" : "text-sm"}>
                {label[locale]}
                <input name={key} type={type} defaultValue={map[key]} className="mt-1 w-full rounded-xl border px-3 py-2" />
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs text-graphite/55">{t("gmailHint", locale)}</p>
          <p className="mt-2 rounded-lg bg-mist p-3 text-xs leading-5 text-graphite/70">{t("gmailValues", locale)}</p>
          <p className="mt-3 text-xs text-graphite/55">{t("resendHint", locale)}</p>
        </section>

        <section className="rounded-lg bg-white p-5 shadow-card">
          <h2 className="font-medium">{t("other", locale)}</h2>
          <div className="mt-4 grid gap-3">
            {otherSettings.map(([key, value]) => (
              <label key={key} className="text-sm">
                {key}
                <input name={key} defaultValue={value} className="mt-1 w-full rounded-xl border px-3 py-2" />
              </label>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <button className="rounded-full bg-ink px-6 py-2 text-white">{c("save", locale)}</button>
          <button
            type="submit"
            formAction={async (fd) => {
              "use server";
              const settings = formSettings(fd, keys);
              await persistSettings(settings);
              const result = await sendTestEmail(settings);
              await prisma.notification.create({
                data: {
                  channel: "email",
                  title: "SMTP test",
                  body: result.message,
                  status: result.status,
                },
              });
              redirect(`/admin/settings?mail=${result.status}`);
            }}
            className="rounded-full border border-black/10 bg-white px-6 py-2"
          >
            {t("sendTest", locale)}
          </button>
        </div>
      </form>
    </div>
  );
}
