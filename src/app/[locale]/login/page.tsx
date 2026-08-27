"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/i18n/routing";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "reg">("login");
  const [err, setErr] = useState("");

  return (
    <div className="container-f max-w-md py-16">
      <h1 className="font-display text-3xl">{mode === "login" ? t("login") : t("register")}</h1>
      <form
        className="mt-8 grid gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: fd.get("email"),
              password: fd.get("password"),
              name: fd.get("name"),
              phone: fd.get("phone"),
            }),
          });
          if (!res.ok) {
            setErr("Помилка авторизації");
            return;
          }
          const data = await res.json();
          if (data.role === "admin") window.location.href = "/admin";
          else router.push("/account");
        }}
      >
        {mode === "reg" && <input name="name" required placeholder="Ім’я" className="rounded-xl border px-4 py-3" />}
        <input name="email" type="email" required placeholder="Email" className="rounded-xl border px-4 py-3" />
        {mode === "reg" && <input name="phone" placeholder="Телефон" className="rounded-xl border px-4 py-3" />}
        <input name="password" type="password" required placeholder={t("password")} className="rounded-xl border px-4 py-3" />
        {err && <p className="text-sm text-accent">{err}</p>}
        <button className="rounded-full bg-ink py-3 text-white">{mode === "login" ? t("submit") : t("create")}</button>
      </form>
      <button className="mt-4 text-sm underline" onClick={() => setMode(mode === "login" ? "reg" : "login")}>
        {mode === "login" ? t("create") : t("login")}
      </button>
    </div>
  );
}
