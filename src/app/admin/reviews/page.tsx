import { prisma } from "@/lib/db";

export default async function ReviewsAdmin() {
  const reviews = await prisma.review.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <h1 className="font-display text-2xl">Відгуки</h1>
      <ul className="mt-6 text-sm">
        {reviews.map((r) => (
          <li key={r.id} className="border-b py-3">
            {r.authorName} · {r.rating} · {r.status}
            <p>{r.text}</p>
            <form
              action={async () => {
                "use server";
                await prisma.review.update({ where: { id: r.id }, data: { status: "approved" } });
              }}
            >
              <button className="text-xs underline">Схвалити</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
