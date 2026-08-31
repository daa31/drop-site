"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "@/i18n/routing";

export function LogoutButton({ label }: { label: string }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/login", { method: "DELETE" }).catch(() => {});
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="focus-ring inline-flex h-10 items-center gap-2 rounded-full bg-[#dc2626] px-5 text-sm font-semibold text-white transition hover:bg-[#b91c1c]"
    >
      <LogOut size={16} />
      {label}
    </button>
  );
}