#!/usr/bin/env bash
set -euo pipefail

PORT="${DEPLOY_RUN_PORT:-5000}"
echo "[deploy-run] serving dist on port ${PORT}"
exec ./node_modules/.bin/serve -l "${PORT}" dist
