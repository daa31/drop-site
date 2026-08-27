import { prisma } from "@/lib/db";

export default async function Users() {
  const users = await prisma.user.findMany();
  return (
    <div>
      <h1 className="font-display text-2xl">Користувачі</h1>
      <ul className="mt-6 text-sm">
        {users.map((u) => (
          <li key={u.id}>
            {u.email} · {u.role}
          </li>
        ))}
      </ul>
    </div>
  );
}
