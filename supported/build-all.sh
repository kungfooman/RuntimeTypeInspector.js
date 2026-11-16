#!/usr/bin/env bash
# Builds every officially supported project's RTI-instrumented bundles.
# Usage: `bash supported/build-all.sh [--skip-install]` from the repo root.
# Build-green gate per project: fetch at pinned rev, rollup build, load the
# bundles, run the exercise scripts. Warning counts are informational only.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FAIL=0
for dir in "$ROOT"/supported/*/; do
  name="$(basename "$dir")"
  [ -f "$dir/build.sh" ] || continue
  echo "=== supported/$name ==="
  if bash "$dir/build.sh"; then
    echo "--- supported/$name: GREEN ---"
  else
    echo "--- supported/$name: RED ---"
    FAIL=1
  fi
done
exit "$FAIL"
