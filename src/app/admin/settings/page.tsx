import { prisma } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/lib/settings";

export default async function SettingsPage() {
  const rows = await prisma.setting.findMany();
  const map = { ...DEFAULT_SETTINGS, ...Object.fromEntries(rows.map((r) => [r.key, r.value])) };
  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl">Налаштування</h1>
      <form
        className="mt-6 grid gap-3"
        action={async (fd) => {
          "use server";
          for (const [key] of Object.entries(map)) {
            const value = String(fd.get(key) ?? "");
            await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
          }
        }}
      >
        {Object.entries(map).map(([k, v]) => (
          <label key={k} className="text-sm">
            {k}
            <input name={k} defaultValue={v} className="mt-1 w-full rounded-xl border px-3 py-2" />
          </label>
        ))}
        <button className="rounded-full bg-ink py-2 text-white">Зберегти</button>
      </form>
    </div>
  );
}
