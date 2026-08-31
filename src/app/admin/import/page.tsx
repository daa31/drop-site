"use client";

import { useState } from "react";

export default function ImportPage() {
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [feedPreview, setFeedPreview] = useState<Record<string, unknown> | null>(null);
  const [feedReport, setFeedReport] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [rrcText, setRrcText] = useState("");
  const [rrcReport, setRrcReport] = useState<Record<string, unknown> | null>(null);
  const [rrcBusy, setRrcBusy] = useState(false);

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

  async function applyRrc() {
    const items = rrcText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split(/[\s,;]+/).map((s) => s.trim()))
      .filter((parts) => parts.length >= 2)
      .map((parts) => ({ article: parts[0], rrc: Number(parts[1].replace(",", ".")) }))
      .filter((i) => i.article && Number.isFinite(i.rrc) && i.rrc > 0);
    if (!items.length) {
      setErr("Немає валідних рядків. Формат: артикул	РРЦ (по одному на рядок)");
      return;
    }
    setRrcBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/import/rrc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Помилка імпорту РРЦ");
      setRrcReport(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Помилка");
    } finally {
      setRrcBusy(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl">Імпорт і ціни</h1>

      <section className="mt-8 rounded-2xl bg-white p-5 shadow-card">
        <h2 className="font-medium">XML-фіди постачальників</h2>
        <p className="mt-2 text-sm text-graphite/70">
          Ціни підтягуються з UAbest (пріоритет: закупівля, залишок, МРЦ) і Pyramex Prom.ua (додаткове джерело за тим самим
          артикулом). Роздрібна ціна перераховується з націнки, не нижче МРЦ. Якщо для товару задано РРЦ — роздріб дорівнює РРЦ і не
            перезаписується при оновленні цін.
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

      <section className="mt-8 rounded-2xl bg-white p-5 shadow-card">
        <h2 className="font-medium">РРЦ постачальника</h2>
        <p className="mt-2 text-sm text-graphite/70">
          Кожен рядок: <code className="rounded bg-mist px-1">артикул&nbsp;&nbsp;&nbsp;350</code> (артикул = sku або артикул
          постачальника, роздільник — таб/пробіл/кома/крапка з комою). Роздрібна ціна стає рівною РРЦ і зберігається далі.
        </p>
        <textarea
          value={rrcText}
          onChange={(e) => setRrcText(e.target.value)}
          rows={8}
          placeholder={"SKU12345\t350\nSKU23456\t459"}
          className="mt-3 w-full rounded-xl border border-black/10 bg-white p-3 font-mono text-sm outline-none focus:border-ink"
        />
        <div className="mt-3 flex items-center gap-3">
          <button disabled={rrcBusy} className="rounded-full bg-ink px-4 py-2 text-sm text-white" onClick={applyRrc}>
            Застосувати РРЦ
          </button>
          {rrcBusy && <p className="text-sm text-graphite/60">Оновлення…</p>}
        </div>
        {rrcReport && (
          <pre className="mt-4 max-h-80 overflow-auto text-sm">{JSON.stringify(rrcReport, null, 2)}</pre>
        )}
      </section>
    </div>
  );
}
