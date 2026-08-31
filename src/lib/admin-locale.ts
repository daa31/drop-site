import { cookies } from "next/headers";
import { ADMIN_LOCALE_COOKIE, normalizeLocale } from "./localization";

export async function getAdminLocale() {
  const jar = await cookies();
  return normalizeLocale(jar.get(ADMIN_LOCALE_COOKIE)?.value);
}
