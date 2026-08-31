#!/usr/bin/env bash
# Deploy Locko to VPS: git переносить лише змінені файли.
# Використання:  ./scripts/deploy.sh [root@HOST] [/shлях/до/app]
set -euo pipefail

HOST="${1:-root@185.143.145.21}"
APP="${2:-/var/www/locko}"

echo "==> Deploy до $HOST:$APP"
ssh -o StrictHostKeyChecking=accept-new "$HOST" "cd '$APP' && git fetch --prune origin && git merge --ff-only @{u} && npm ci --no-audit --no-fund && npx prisma generate && npm run build && (pm2 restart locko --update-env && pm2 save || echo 'PM2: спершу setup-server.sh')"
echo "==> Готово"