"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LoaderCircle, Pencil, X } from "lucide-react";
import { useRouter } from "@/i18n/routing";

export type ProfileFieldName = "email" | "phone" | "name";

export function ProfileField({
  label,
  value,
  field,
  addTitle,
  saveLabel,
  cancelLabel,
  saveErrorText,
  invalidEmailText,
  invalidPhoneText,
  emailTakenText,
  placeholder,
  editTitle,
}: {
  label: string;
  value: string | null | undefined;
  field: ProfileFieldName;
  addTitle: string;
  saveLabel: string;
  cancelLabel: string;
  saveErrorText: string;
  invalidEmailText: string;
  invalidPhoneText: string;
  emailTakenText: string;
  placeholder: string;
  editTitle?: string;
}) {
  const router = useRouter();
  const id = useId();
  const hasValue = Boolean(value && value.trim());
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function start() {
    setText(value || "");
    setError("");
    setEditing(true);
  }

  function stop() {
    setEditing(false);
    setError("");
  }

  async function save() {
    const raw = text.trim();
    if (field === "email" && raw && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw)) {
      setError(invalidEmailText);
      return;
    }
    if (field === "phone" && raw && raw.replace(/\D/g, "").length < 10) {
      setError(invalidPhoneText);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: raw || null }),
      });
      if (res.status === 409) {
        setError(emailTakenText);
        setBusy(false);
        return;
      }
      if (!res.ok) throw new Error("save failed");
      setBusy(false);
      setEditing(false);
      router.refresh();
    } catch {
      setBusy(false);
      setError(saveErrorText);
    }
  }

  const inputId = `profile-${field}-${id}`;

  if (!editing) {
    return (
      <div>
        <div className="text-xs uppercase tracking-wide text-graphite/45">{label}</div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-graphite/60">{hasValue ? value : "—"}</span>
          {hasValue ? (
            <button
              type="button"
              title={editTitle ?? addTitle}
              onClick={start}
              className="focus-ring inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-black/10 text-graphite/50 transition hover:border-black/25 hover:text-graphite"
            >
              <Pencil size={13} />
            </button>
          ) : (
            <button
              type="button"
              title={addTitle}
              onClick={start}
              className="focus-ring inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-black/10 text-graphite/50 transition hover:border-black/25 hover:text-graphite"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-graphite/45">{label}</div>
      <div className="mt-1">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            id={inputId}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !busy) void save();
              if (e.key === "Escape") stop();
            }}
            placeholder={placeholder}
            inputMode={field === "phone" ? "tel" : "text"}
            autoComplete={field === "email" ? "email" : "tel"}
            className="w-full min-w-0 max-w-[240px] rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none transition focus:border-black/40"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void save()}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#111214] px-3.5 text-xs font-semibold text-white transition hover:bg-black disabled:opacity-60"
          >
            {busy && <LoaderCircle size={13} className="animate-spin" />}
            {saveLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={stop}
            aria-label={cancelLabel}
            className="focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-full text-graphite/60 transition hover:bg-mist hover:text-graphite"
          >
            <X size={15} />
          </button>
        </div>
        {error && <p className="mt-1.5 text-xs font-medium text-[#dc2626]">{error}</p>}
      </div>
    </div>
  );
}