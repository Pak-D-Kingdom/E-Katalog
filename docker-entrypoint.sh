#!/bin/sh
set -e

# Pastikan folder public/uploads ada dan dimiliki oleh nextjs:nodejs (UID/GID 1001)
mkdir -p /app/public/uploads
chown -R nextjs:nodejs /app/public/uploads
chmod -R 775 /app/public/uploads

if [ -n "$DATABASE_URL" ]; then
  MAX_RETRIES=30
  COUNT=0
  
  until node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    prisma.\$queryRaw\`SELECT 1\`
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  " >/dev/null 2>&1; do
    COUNT=$((COUNT + 1))
    if [ $COUNT -ge $MAX_RETRIES ]; then
      break
    fi
    sleep 2
  done

  if [ $COUNT -lt $MAX_RETRIES ]; then
    if [ "$AUTO_MIGRATE" != "false" ]; then
      npx prisma migrate deploy || npx prisma db push --skip-generate || true
    fi

    if [ "$AUTO_SEED" = "true" ]; then
      if [ -f "./prisma/seed.js" ]; then
        node ./prisma/seed.js || true
      elif [ -f "./prisma/seed.ts" ]; then
        npx tsx ./prisma/seed.ts || true
      fi
    fi
  fi
fi

if [ "$(id -u)" = "0" ]; then
  exec su-exec nextjs "$@"
else
  exec "$@"
fi
