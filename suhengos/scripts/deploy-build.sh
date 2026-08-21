#!/usr/bin/env bash
set -euo pipefail

echo "[deploy-build] node: $(node -v 2>&1), pnpm: $(pnpm -v 2>&1)"
echo "[deploy-build] installing dependencies..."
pnpm install --no-frozen-lockfile --no-optional
echo "[deploy-build] building..."
pnpm run build
echo "[deploy-build] done. dist contents:"
ls -la dist/ | head -20
