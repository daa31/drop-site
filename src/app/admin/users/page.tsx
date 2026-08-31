import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ShieldCheck, UserPlus, Users as UsersIcon } from "lucide-react";
import { ADMIN_COMMON_COPY } from "@/lib/admin-copy";
import { getAdminLocale } from "@/lib/admin-locale";
import { prisma } from "@/lib/db";
import { formatDateTime, type Locale } from "@/lib/localization";
import { isEmailIdentifier, isValidEmail, isValidUsername, normalizeIdentifier } from "@/lib/user-identity";

const COPY = {
  title: { uk: "Акаунти", ru: "Аккаунты", en: "Accounts" },
  subtitle: {
    uk: "Усі логіни сайту: адміністратори й покупці. Тут можна створити новий акаунт і одразу задати роль.",
    ru: "Все логины сайта: администраторы и покупатели. Здесь можно создать новый аккаунт и сразу задать роль.",
    en: "All site logins: administrators and buyers. Create an account and set its role here.",
  },
  createTitle: { uk: "Додати користувача", ru: "Добавить пользователя", en: "Add user" },
  createHint: {
    uk: "Логін може бути звичайним ім'ям користувача або email. Пароль - від 4 символів.",
    ru: "Логин может быть обычным именем пользователя или email. Пароль - от 4 символов.",
    en: "Login can be a username or an email. Password must be at least 4 characters.",
  },
  identifier: { uk: "Логін або email", ru: "Логин или email", en: "Login or email" },
  name: { uk: "Ім'я", ru: "Имя", en: "Name" },
  phone: { uk: "Телефон", ru: "Телефон", en: "Phone" },
  password: { uk: "Пароль", ru: "Пароль", en: "Password" },
  role: { uk: "Роль", ru: "Роль", en: "Role" },
  admin: { uk: "Адмін", ru: "Админ", en: "Admin" },
  customer: { uk: "Покупець", ru: "Покупатель", en: "Customer" },
  listTitle: { uk: "Усі акаунти", ru: "Все аккаунты", en: "All accounts" },
  login: { uk: "Логін", ru: "Логин", en: "Login" },
  contact: { uk: "Контакт", ru: "Контакт", en: "Contact" },
  createdAt: { uk: "Створено", ru: "Создан", en: "Created" },
  created: { uk: "Користувача створено.", ru: "Пользователь создан.", en: "User created." },
  invalid: { uk: "Заповніть логін, ім'я і пароль від 4 символів.", ru: "Заполните логин, имя и пароль от 4 символов.", en: "Fill login, name and a 4+ character password." },
  invalidIdentifier: {
    uk: "Логін може містити літери, цифри, крапку, дефіс або підкреслення. Email має бути коректним.",
    ru: "Логин может содержать буквы, цифры, точку, дефис или подчеркивание. Email должен быть корректным.",
    en: "Username can contain letters, numbers, dot, hyphen or underscore. Email must be valid.",
  },
  exists: { uk: "Такий логін або email уже існує.", ru: "Такой логин или email уже существует.", en: "This login or email already exists." },
} satisfies Record<string, Record<Locale, string>>;

function t(key: keyof typeof COPY, locale: Locale) {
  return COPY[key][locale];
}

function c(key: keyof typeof ADMIN_COMMON_COPY, locale: Locale) {
  return ADMIN_COMMON_COPY[key][locale];
}

function textValue(fd: FormData, key: string) {
  return String(fd.get(key) || "").trim();
}

function usersRedirect(params: Record<string, string>): never {
  const sp = new URLSearchParams(params);
  redirect(`/admin/users?${sp.toString()}`);
}

async function createUser(fd: FormData) {
  "use server";

  const identifier = normalizeIdentifier(textValue(fd, "identifier"));
  const name = textValue(fd, "name");
  const phone = textValue(fd, "phone");
  const password = textValue(fd, "password");
  const role = textValue(fd, "role") === "admin" ? "admin" : "customer";

  if (!identifier || name.length < 2 || password.length < 4) usersRedirect({ error: "invalid" });

  const isEmail = isEmailIdentifier(identifier);
  if (isEmail && !isValidEmail(identifier)) usersRedirect({ error: "invalid_identifier" });
  if (!isEmail && !isValidUsername(identifier)) usersRedirect({ error: "invalid_identifier" });

  const exists = await prisma.user.findFirst({ where: { OR: [{ email: identifier }, { username: identifier }] } });
  if (exists) usersRedirect({ error: "exists" });

  await prisma.user.create({
    data: {
      email: isEmail ? identifier : null,
      username: isEmail ? null : identifier,
      passwordHash: await bcrypt.hash(password, 12),
      name,
      phone: phone || null,
      role,
    },
  });

  revalidatePath("/admin/users");
  usersRedirect({ created: "1" });
}

function roleLabel(role: string, locale: Locale) {
  return role === "admin" ? t("admin", locale) : t("customer", locale);
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [locale, sp, users] = await Promise.all([
    getAdminLocale(),
    searchParams,
    prisma.user.findMany({ orderBy: [{ role: "asc" }, { createdAt: "desc" }] }),
  ]);
  const error = typeof sp.error === "string" ? sp.error : "";
  const errorText = error === "exists" ? t("exists", locale) : error === "invalid_identifier" ? t("invalidIdentifier", locale) : error ? t("invalid", locale) : "";

  return (
    <div className="grid max-w-6xl gap-6">
      <div>
        <h1 className="font-display text-3xl">{t("title", locale)}</h1>
        <p className="mt-1 text-sm text-graphite/60">{t("subtitle", locale)}</p>
        {sp.created && <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{t("created", locale)}</div>}
        {errorText && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorText}</div>}
      </div>

      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-card">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ink text-white">
            <UserPlus size={18} />
          </span>
          <div>
            <h2 className="font-semibold">{t("createTitle", locale)}</h2>
            <p className="mt-1 text-sm text-graphite/60">{t("createHint", locale)}</p>
          </div>
        </div>
        <form action={createUser} className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm">
            {t("identifier", locale)}
            <input name="identifier" required className="mt-1 h-11 w-full rounded-lg border border-black/10 px-3 outline-none focus:border-ink" />
          </label>
          <label className="text-sm">
            {t("name", locale)}
            <input name="name" required className="mt-1 h-11 w-full rounded-lg border border-black/10 px-3 outline-none focus:border-ink" />
          </label>
          <label className="text-sm">
            {t("phone", locale)}
            <input name="phone" className="mt-1 h-11 w-full rounded-lg border border-black/10 px-3 outline-none focus:border-ink" />
          </label>
          <label className="text-sm">
            {t("password", locale)}
            <input name="password" type="password" required minLength={4} className="mt-1 h-11 w-full rounded-lg border border-black/10 px-3 outline-none focus:border-ink" />
          </label>
          <label className="text-sm sm:col-span-2 lg:col-span-1">
            {t("role", locale)}
            <select name="role" defaultValue="customer" className="mt-1 h-11 w-full rounded-lg border border-black/10 bg-white px-3 outline-none focus:border-ink">
              <option value="customer">{t("customer", locale)}</option>
              <option value="admin">{t("admin", locale)}</option>
            </select>
          </label>
          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white transition hover:bg-accent">
              <UserPlus size={17} />
              {c("save", locale)}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-card">
        <div className="flex items-center justify-between gap-3 border-b border-black/10 px-5 py-4">
          <div className="flex items-center gap-2 font-semibold">
            <UsersIcon size={18} />
            {t("listTitle", locale)}
          </div>
          <span className="rounded-full bg-mist px-3 py-1 text-xs font-semibold text-graphite/55">{users.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-mist text-xs uppercase tracking-wide text-graphite/45">
              <tr>
                <th className="px-5 py-3">{t("login", locale)}</th>
                <th className="px-4 py-3">{t("contact", locale)}</th>
                <th className="px-4 py-3">{t("role", locale)}</th>
                <th className="px-4 py-3">{t("createdAt", locale)}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-black/5">
                  <td className="px-5 py-4">
                    <div className="font-medium">{user.username || user.email || user.id}</div>
                    <div className="mt-1 text-xs text-graphite/45">{user.name}</div>
                  </td>
                  <td className="px-4 py-4 text-graphite/70">
                    <div>{user.email || "-"}</div>
                    <div className="mt-1 text-xs text-graphite/45">{user.phone || "-"}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${user.role === "admin" ? "bg-ink text-white" : "bg-mist text-graphite/70"}`}>
                      {user.role === "admin" && <ShieldCheck size={13} />}
                      {roleLabel(user.role, locale)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-graphite/60">{formatDateTime(user.createdAt, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
