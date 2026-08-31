"use client";

import { useState } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/routing";

export function DeleteAccountButton({
  label,
  title,
  text,
  confirmLabel,
  cancelLabel,
  errorLabel,
}: {
  label: string;
  title: string;
  text: string;
  confirmLabel: string;
  cancelLabel: string;
  errorLabel: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function doDelete() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/delete", { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      router.push("/");
      router.refresh();
    } catch {
      setError(errorLabel);
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <div className="relative">
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="focus-ring inline-flex h-10 items-center gap-2 rounded-full border border-[#dc2626]/40 px-5 text-sm font-semibold text-[#dc2626] transition hover:bg-red-50"
        >
          <Trash2 size={16} />
          {label}
        </button>
      ) : (
        <div className="absolute right-0 top-12 z-20 w-80 rounded-xl border border-black/10 bg-white p-4 shadow-card">
          <div className="text-sm font-semibold">{title}</div>
          <p className="mt-1 text-xs leading-relaxed text-graphite/70">{text}</p>
          {error && <p className="mt-2 text-xs font-medium text-[#dc2626]">{error}</p>}
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="h-9 rounded-full px-4 text-sm font-semibold text-graphite/70 transition hover:bg-mist"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void doDelete()}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-[#dc2626] px-4 text-sm font-semibold text-white transition hover:bg-[#b91c1c] disabled:opacity-60"
            >
              {busy && <LoaderCircle size={14} className="animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}