#!/usr/bin/env bash
# Builds the RTI-instrumented three.js bundles and overwrites the upstream
# build artifacts in place, so the stock examples page loads the
# instrumented engine with zero changes:
# https://repo.runtimetypeinspector.org/tmp/supported/three.js/examples/index.html
# Run from the repo root: `bash supported/three/build.sh`.
# Layout contract: upstream checkouts live under tmp/supported/ (git-ignored,
# fetched here with `git clone --depth 1`), build definitions live here under
# supported/three/ (committed). Never the reverse.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
UPSTREAM="$ROOT/tmp/supported/three.js"
# 1. Fetch: shallow clone at the pinned rev, or verify an existing checkout.
node "$ROOT/supported/scripts/fetch-upstream.mjs" "$HERE/project.json"
# 2. Sync the working-tree RTI bundles into the sandbox installs, so the
# bundles below always instrument with local changes, not the last publish.
# `build` at the repo root honors the `target` env (default: all four
# bundles); the sandbox build below reads the transpiler through the
# sandbox symlink, so a stale `target` export here silently instruments
# with yesterday's transpiler. Clear it first, like CI does.
node "$ROOT/sync-version.js"
target= npm run --prefix "$ROOT" build
[ -d "$HERE/node_modules" ] || npm ci --prefix "$HERE"
node "$ROOT/sync-consumer.js" "$HERE"
# 3. Regenerate the const-enum typedef shims from the pinned checkout, then build.
node "$HERE/gen-enums.mjs"
npm run --prefix "$HERE" build
# 4. Overwrite the upstream build artifacts in place: same entry filenames,
# same layout, instrumented engine. The three.cjs require(esm) shim keeps its
# upstream shape. Shared chunks keep their hashed names; wipe the whole build
# dir first so a renamed chunk from a previous rev never shadows the current
# one. The shared chunks are load-bearing: entries import them relatively, so
# every entry on a page evaluates the runtime and Three.Core.js exactly once
# (single class identity, single panel, single error count).
rm -rf "$UPSTREAM/build"
mkdir -p "$UPSTREAM/build"
cp "$HERE"/build-upstream-names/*.js "$UPSTREAM/build/"
cp "$HERE/three.cjs" "$UPSTREAM/build/three.cjs"
# Drop the checkout's runtime symlink: the shared chunks carry the runtime
# now, so neither node nor the browser resolves the bare specifier anymore.
rm -rf "$UPSTREAM/node_modules"
# 5. Build-green gate: bundles load, export counts hold, valid usage is silent.
node "$HERE/smoke.mjs"
node "$HERE/exercise.mjs"
