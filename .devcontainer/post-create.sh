#!/bin/bash
# Post-create for web-fullstack devcontainer
set -e

echo "==> Node + pnpm versiyonları"
node --version
pnpm --version

echo "==> Servisler hazır mı?"
echo -n "  postgres: "
pg_isready -h postgres -U dev && echo "OK" || echo "FAIL"
echo -n "  redis: "
redis-cli -h redis ping && echo "OK" || echo "FAIL"

echo "==> package.json varsa pnpm install"
if [ -f package.json ]; then
    pnpm install --frozen-lockfile 2>/dev/null || pnpm install
else
    echo "  (package.json yok, install atlandı)"
fi

echo "✅ Web full-stack container hazır"
echo ""
echo "Bağlantı bilgileri (container içinden):"
echo "  DATABASE_URL=postgres://dev:dev@postgres:5432/dev"
echo "  REDIS_URL=redis://redis:6379"
