import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";
import { createElement } from "react";
import type { ComponentProps } from "react";

export const routing = defineRouting({
  locales: ["uk", "ru", "en"],
  defaultLocale: "uk",
  localePrefix: "as-needed",
});

const navigation = createNavigation(routing);
const LocalizedLink = navigation.Link;

export function Link({ prefetch = false, ...props }: ComponentProps<typeof LocalizedLink>) {
  return createElement(LocalizedLink, { ...props, prefetch });
}

export const { redirect, usePathname, useRouter, getPathname } = navigation;
