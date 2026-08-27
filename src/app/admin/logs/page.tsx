import { prisma } from "@/lib/db";

export default async function Logs() {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  const imports = await prisma.importJob.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
  return (
    <div>
      <h1 className="font-display text-2xl">Логи</h1>
      <h2 className="mt-6 font-medium">Імпорти</h2>
      <ul className="text-sm">
        {imports.map((i) => (
          <li key={i.id}>
            {i.createdAt.toISOString()} {i.filename} {i.status}
          </li>
        ))}
      </ul>
      <h2 className="mt-6 font-medium">Аудит</h2>
      <ul className="text-sm">
        {logs.map((l) => (
          <li key={l.id}>
            {l.createdAt.toISOString()} {l.actor} {l.action} {l.entity}
          </li>
        ))}
      </ul>
    </div>
  );
}
