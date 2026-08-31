#!/usr/bin/env bash
# Deploy Locko to VPS: git переносить лише змінені файли (shallow fetch, ~КБ/МБ).
# Використання:  ./scripts/deploy.sh [root@HOST] [/var/www/locko.shop]
# ПРАВИЛО: запускати ТІЛЬКИ за явною командою користувача.
set -euo pipefail

HOST="${1:-root@185.143.145.21}"
APP="${2:-/var/www/locko.shop}"

echo "==> Deploy до $HOST:$APP"
ssh -o BatchMode=yes "$HOST" "cd '$APP' \
  && git fetch --depth 1 --prune origin main \
  && git reset --hard FETCH_HEAD \
  && npm install --no-audit --no-fund --no-progress \
  && npx prisma generate \
  && npx prisma db push --skip-generate \
  && NEXT_TELEMETRY_DISABLED=1 npm run build \
  && pm2 restart locko-shop --update-env && pm2 save"
echo "==> Готово. Перевірте: curl -I https://locko.shop"