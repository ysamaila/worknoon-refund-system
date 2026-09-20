#!/bin/sh
set -e

echo "[Worknoon API] Syncing database schema with Prisma..."
npx prisma db push --skip-generate

echo "[Worknoon API] Seeding idempotent fixture dataset..."
node dist/prisma/seed.js

echo "[Worknoon API] Launching NestJS production server..."
exec node dist/src/main.js
