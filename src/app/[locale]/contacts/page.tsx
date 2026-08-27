import { siteSettings } from "@/lib/settings";

export default async function Contacts() {
  const s = await siteSettings();
  return (
    <div className="container-f max-w-xl py-10">
      <h1 className="font-display text-3xl">Контакти</h1>
      <div className="mt-8 space-y-2 text-graphite/80">
        <p>{s.phone}</p>
        <p>{s.email}</p>
        <p>{s.telegram}</p>
        <p>{s.hours}</p>
      </div>
      <form className="mt-10 grid gap-3" action="/api/contact" method="post">
        <input name="name" required placeholder="Ім’я" className="rounded-xl border px-4 py-3" />
        <input name="email" type="email" required placeholder="Email" className="rounded-xl border px-4 py-3" />
        <textarea name="message" required className="rounded-xl border px-4 py-3" rows={5} />
        <button className="rounded-full bg-ink py-3 text-white">Надіслати</button>
      </form>
    </div>
  );
}
