# FORTIS

Спеціалізований інтернет-магазин захисних, спортивних і тактичних окулярів та ЗІЗ.

Бренд власний. Асортимент і характеристики узгоджені з публічним каталогом постачальника, без копіювання дизайну, логотипу чи текстів UAbest.

## Стек

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite (локально) / PostgreSQL (Docker)
- next-intl: **українська за замовчуванням**, російська, англійська
- Сесії (jose), bcrypt, CSRF-токени форм, rate limit

## Швидкий старт

Потрібен Node.js 20+.

```bash
cp .env.example .env
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

Відкрийте [http://localhost:3000](http://localhost:3000)

Адмінка: [http://localhost:3000/admin](http://localhost:3000/admin)

- Email: `admin@fortis.ua`
- Пароль: з `.env` (`ADMIN_PASSWORD`, за замовчуванням `ChangeMe_Admin_123`)

## Мови

| Код | URL |
|-----|-----|
| uk (default) | `/catalog` |
| ru | `/ru/catalog` |
| en | `/en/catalog` |

## Імпорт постачальника

Адмінка → Імпорт (`/admin/import`). CSV / XML / XLS(X). Зіставлення по артикулу. Перед застосуванням — preview і підтвердження. Товари, яких немає у файлі, не видаляються: стають неактивними.

Приклад CSV: `data/sample-import.csv`

## Docker (PostgreSQL)

1. У `prisma/schema.prisma` змініть `provider` на `postgresql`.
2. `docker compose up -d`
3. `DATABASE_URL=postgresql://fortis:fortis@localhost:5432/fortis npm run db:push`

## Безпека

Не комітьте `.env`. Змініть `AUTH_SECRET` і пароль адміністратора перед продакшеном. HTTPS обов’язковий у production.
