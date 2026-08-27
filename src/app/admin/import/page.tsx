"use client";

import { useState } from "react";

export default function ImportPage() {
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [feedPreview, setFeedPreview] = useState<Record<string, unknown> | null>(null);
  const [feedReport, setFeedReport] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function send(confirm: boolean, file: File) {
    const fd = new FormData();
    fd.set("file", file);
    fd.set("confirm", String(confirm));
    const res = await fetch("/api/import", { method: "POST", body: fd });
    const data = await res.json();
    if (confirm) setReport(data.report);
    else setPreview(data.preview);
  }

  async function runFeeds(apply: boolean, createMissing = false) {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/feeds/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apply, createMissing }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Помилка фіду");
      if (apply) setFeedReport(data.report);
      else setFeedPreview(data.preview);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Помилка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl">Імпорт і ціни</h1>

      <section className="mt-8 rounded-2xl bg-white p-5 shadow-card">
        <h2 className="font-medium">XML-фіди постачальників</h2>
        <p className="mt-2 text-sm text-graphite/70">
          Ціни підтягуються з UAbest (пріоритет: закупівля, залишок, МРЦ) і Pyramex Prom.ua (додаткове джерело за тим самим
          артикулом). Роздрібна ціна перераховується з націнкою, не нижче МРЦ.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button disabled={busy} className="rounded-full border px-4 py-2 text-sm" onClick={() => runFeeds(false)}>
            Перевірити фіди
          </button>
          <button
            disabled={busy}
            className="rounded-full bg-ink px-4 py-2 text-sm text-white"
            onClick={() => runFeeds(true, false)}
          >
            Оновити ціни
          </button>
          <button disabled={busy} className="rounded-full border px-4 py-2 text-sm" onClick={() => runFeeds(true, true)}>
            Оновити ціни і додати нові
          </button>
        </div>
        {busy && <p className="mt-3 text-sm text-graphite/60">Завантаження фіду…</p>}
        {err && <p className="mt-3 text-sm text-accent">{err}</p>}
        {feedPreview && (
          <pre className="mt-4 max-h-80 overflow-auto text-xs">{JSON.stringify(feedPreview, null, 2)}</pre>
        )}
        {feedReport && <pre className="mt-4 max-h-80 overflow-auto text-xs">{JSON.stringify(feedReport, null, 2)}</pre>}
      </section>

      <section className="mt-8 rounded-2xl bg-white p-5 shadow-card">
        <h2 className="font-medium">Файл CSV / XML / XLS</h2>
        <p className="mt-2 text-sm text-graphite/70">Зіставлення по артикулу. Товари поза файлом не видаляються без підтвердження цього імпорту.</p>
        <input
          type="file"
          className="mt-4"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) await send(false, f);
          }}
        />
        {preview && (
          <div className="mt-4 text-sm">
            <pre className="whitespace-pre-wrap">{JSON.stringify(preview, null, 2)}</pre>
            <button
              className="mt-4 rounded-full bg-ink px-4 py-2 text-white"
              onClick={async () => {
                const input = document.querySelector("input[type=file]") as HTMLInputElement;
                const f = input.files?.[0];
                if (f) await send(true, f);
              }}
            >
              Підтвердити імпорт
            </button>
          </div>
        )}
        {report && <pre className="mt-4 text-sm">{JSON.stringify(report, null, 2)}</pre>}
      </section>
    </div>
  );
}
