#!/usr/bin/env bash
set -euo pipefail

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="/opt/eila-os"
TARGET="$ROOT/job_site/apps/web-public/assets/runtime-c-live-sandbox"

cd "$ROOT"

if [ -d "$TARGET" ]; then
  BACKUP="${TARGET}.pre-modular-build-request.$(date -u +%Y%m%dT%H%M%SZ)"
  mv "$TARGET" "$BACKUP"
  echo "Backed up existing sandbox to $BACKUP"
fi

mkdir -p "$TARGET"
cp -a "$SRC_DIR/"* "$TARGET/"

echo "Installed modular build-request sandbox to $TARGET"
echo "Open: https://operator.xyz-labs.xyz/assets/runtime-c-live-sandbox/index.html?modular=1"
