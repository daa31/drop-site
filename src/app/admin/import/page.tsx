"use client";

import { useState } from "react";

export default function ImportPage() {
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [report, setReport] = useState<Record<string, unknown> | null>(null);

  async function send(confirm: boolean, file: File) {
    const fd = new FormData();
    fd.set("file", file);
    fd.set("confirm", String(confirm));
    const res = await fetch("/api/import", { method: "POST", body: fd });
    const data = await res.json();
    if (confirm) setReport(data.report);
    else setPreview(data.preview);
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl">Імпорт</h1>
      <p className="mt-2 text-sm text-graphite/70">CSV / XML / XLS. Зіставлення по артикулу. Товари поза файлом не видаляються.</p>
      <input
        type="file"
        className="mt-6"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) await send(false, f);
        }}
      />
      {preview && (
        <div className="mt-6 rounded-2xl bg-white p-4 text-sm shadow-card">
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
    </div>
  );
}
