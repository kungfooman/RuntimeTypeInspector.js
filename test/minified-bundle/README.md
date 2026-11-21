# minified-bundle litmus

Proves RTI's nominal checks survive real bundling: the fixtures are bundled
with actual Rollup (scope-hoisting + deconfliction) and minified with the
repo's own `@rollup/plugin-terser` (`toplevel` mangling, like esbuild/webpack
production output where no binding keeps its source spelling).

- `fixtures/shapes.mjs` — library half: classes, a generic `Box`, and the
  cannon.js shape (old-style `function World()` + `World.prototype = new
  EventTarget()` with no `constructor` fixup). Its own module forces Rollup
  to scope-hoist and rename bindings.
- `fixtures/entry.mjs` — annotated functions with valid calls plus exactly
  two intentional negatives (`lengthSquared(42)`, `boot(world, {x, y})`).
- `build.mjs` — programmatic Rollup with an RTI transform mirroring
  `plugin-rollup`'s hook, but importing the working-tree transpiler and
  rewriting the runtime import to the working-tree runtime, so the test
  exercises current code on both sides. Emits `out/app.bundle.mjs` (plain)
  and `out/app.min.mjs` (minified).
- `runBundle.mjs` — runs a bundle file in a fresh `node` child process
  (`run-bundle-child.mjs` captures `postMessage` errors to a results JSON
  file) and reads the report back. Nothing is imported in-process: the
  files on disk are the artifacts under test.
- `run.mjs` — asserts plain ≡ minified ≡ exactly the expected dedup keys.

```sh
node test/minified-bundle/run.mjs   # bundles land in out/ (gitignored)
node test/minified-bundle/out/app.min.mjs  # run the minified artifact directly
npm run test:minified-bundle        # wired into npm test
```

On the pre-identity baseline the minified bundle reports false positives
for valid calls (`boot-world`, `unbox-box`); with identity-first references
both bundles agree on exactly the intentional negatives.
