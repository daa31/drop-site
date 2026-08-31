"use client";

import { Trash2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type OrderActionLabels = {
  trigger: string;
  title: string;
  description: string;
  confirm: string;
  cancel: string;
  error: string;
};

export function OrderActionButton({
  orderId,
  labels,
  tone = "danger",
  redirectTo,
}: {
  orderId: string;
  labels: OrderActionLabels;
  tone?: "danger" | "neutral";
  redirectTo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const Icon = redirectTo ? Trash2 : XCircle;

  async function confirm() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
    if (!res.ok) {
      setError(labels.error);
      setBusy(false);
      return;
    }
    setOpen(false);
    if (redirectTo) router.push(redirectTo);
    else router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold ${
          tone === "danger" ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100" : "border-black/10 bg-white text-graphite/70 hover:bg-mist"
        }`}
      >
        <Icon size={16} />
        {labels.trigger}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-ink/45 p-4" role="dialog" aria-modal="true" aria-labelledby={`order-action-${orderId}`}>
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-[0_24px_80px_rgba(17,18,20,0.28)]">
            <h2 id={`order-action-${orderId}`} className="text-lg font-semibold">
              {labels.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-graphite/65">{labels.description}</p>
            {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} disabled={busy} className="h-10 rounded-lg border border-black/10 bg-white px-4 text-sm font-semibold text-graphite/70">
                {labels.cancel}
              </button>
              <button type="button" onClick={confirm} disabled={busy} className="h-10 rounded-lg bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60">
                {labels.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
