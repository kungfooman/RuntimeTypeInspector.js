# Officially supported projects

Each folder under `supported/` is one upstream project RTI can instrument,
load, and exercise. The contract is build-green, not warning-free: the
instrumented bundles must build, load in node, and run the project's
`exercise.mjs` without throwing. Warning counts stay informational (see the
project's `findings.md`, never a gate).

## Layout contract

Upstream checkouts live under `tmp/supported/<name>` and are git-ignored:
they are fetched by each project's `build.sh` with `git clone --depth 1` and
pinned to the rev in `project.json`. Build definitions live here under
`supported/<name>/` and are committed. Never the reverse: no vendored
upstream source, no checkout state committed.

```
supported/
  build-all.sh      # runs every supported/*/build.sh, reports GREEN/RED
  <name>/
    project.json    # machine-readable manifest: repo, pinned rev, checkouts, bundles
    build.sh        # fetch + sync + build + overwrite + gate, runnable standalone
    package.json    # sandbox deps (rollup, RTI plugin, upstream build deps)
    <name>.rti.js   # entry per bundle: re-export runtime, re-export upstream, setOptions, shims
    rollup.config.mjs
    smoke.mjs       # loads the bundle, fails on load errors
    exercise.mjs    # valid-usage run: must stay silent
    findings.md     # triaged warnings: real upstream bugs with repros
    examples-page.md # how to load the instrumented engine on the stock demos page
    gen-*.mjs       # optional generators for project-local shims
```

## Demo strategy: overwrite upstream build artifacts in place

Server-side harnesses (QUnit-in-node and friends) died on upstream test
plumbing: custom assertions, browser-only suites, ESM import cycles. The
strategy that survives is dumber: build the instrumented engine under the
exact upstream filenames and let the project's own demos page run it. For
three.js that means `tmp/supported/three.js/build/three.{core,module,tsl,webgpu,webgpu.nodes}.js`
hold RTI output, and the untouched
`tmp/supported/three.js/examples/index.html` loads the instrumented engine
with one extra import-map line (see `<name>/examples-page.md`). The project's
own 600+ examples become the stress test: open any example, interact, and
the TypePanel (fed via `crossContextPostMessage` from the iframe) shows
live findings. No test porting, no DOM shims, no harness to rot when
upstream renames a suite.

## Adding a project

1. Add the upstream URL and entry point to the sweep roots in `tmp/sweep-repos.mjs` to confirm JSDoc density first.
2. Copy `supported/three/` as a template, write `project.json`, the `.rti.js` entry, and the host-specific rollup transforms (if any).
3. Run `bash supported/<name>/build.sh` until green, then triage warnings into `findings.md`.
4. Wire the folder into `supported/build-all.sh` (automatic: any folder with a `build.sh` is picked up).

## Shim layering

Two workaround kinds emerged from three.js, and they live in different places.
Project-local shims (const-enum typedefs, `customTypes` entries) stay in
`supported/<name>/` with a comment naming the upstream RTI change that would
obsolete them. RTI bugs found while building (missing syntax emitters,
stale-runtime shadowing, entry-eval order) are fixed in the repo with specs
and fixtures, never worked around per project. If two projects need the same
shim, it is an RTI feature: promote it.
