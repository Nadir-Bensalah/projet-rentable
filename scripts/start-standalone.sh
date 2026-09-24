#!/usr/bin/env sh
# Runs the production build exactly as deployed (Next.js standalone output).
set -e
cd "$(dirname "$0")/.."
if [ ! -f .next/standalone/server.js ]; then
  echo "Missing build: run npm run build first" >&2
  exit 1
fi
mkdir -p .next/standalone/.next
rm -rf .next/standalone/public .next/standalone/.next/static
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
exec node .next/standalone/server.js
