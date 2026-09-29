# AGENTS.md

## Checking JSDoc types like `tsc`

`node run-jsdoc.js [--emit] <file.mjs>` transpiles `<file>` with the RTI
transpiler (same pipeline as `test.js`), executes it against the
working-tree runtime and prints every reported type error to stdout, like
`tsc --noEmit` (nothing is written; redirect output yourself). With `--emit`,
the transpiled source is additionally kept next to the input as
`<basename>.rti.mjs`. Exits 1 when errors were reported.

`tsc` comparison is possible on the same file: any pure-JSDoc demo
(no RTI imports) can be checked both ways, e.g.

```sh
npx tsc --noEmit --allowJs --checkJs --strict test/typechecking/noinfer-templates-input.mjs
node run-jsdoc.js test/typechecking/noinfer-templates-input.mjs
```

## Runnables / demos

- `test/typechecking/noinfer-templates-input.mjs` (+ `-output.mjs`) —
  joint template inference + `NoInfer` fixtures with `// ok` / `// warns:`
  runtime contracts (`K` pins from the bare occurrence, nested occurrences
  contribute candidates unless wrapped in `NoInfer<K>`).

## Making repro tests permanent

When the user hands you tests (repro files, `/tmp` snippets, demo cases), make them permanent instead of leaving them in `/tmp` — plus your own creative variants:

- Fixture: `test/typechecking/<name>-input.mjs` (+ `-output.mjs`,
  generated with the same pipeline as `test.js`) with `// ok` / `// warns:`
  runtime contracts; regenerate `test/typechecking.json` via `gen_tests.js`.
  E.g. `class-templates-input.mjs` for issue #265.
- Spec: `src-transpiler/<name>.spec.js` (or `src-runtime/`) in repo style
  (sync boolean tests, `export const tests`), wired into `test_runtime.js`.
  Cover the transpiler output AND creative variants of your own: edge cases
  the repro didn't show (export wrappers, template shadowing, bare
  templates, widening vs warns at runtime).
- Prove the tests bite: stash the fix and show they fail, pop and show green.
- Full gate before finishing: `npm test` + `npm run lint`.

## Test suite

```sh
npm test  # test:update (gen_tests.js) + test.js + test_runtime.js + jsdoc/ts2js/wat suites
npm run lint  # eslint over src-transpiler and src-runtime only
```

Note: `test.js` proves transpile parity only — a quiet `// warns` comment
passes it. Runtime behavior of fixtures is covered by `test_runtime.js`
specs (e.g. `src-runtime/templateNarrowing.spec.js`,
`src-runtime/collectCandidates.spec.js`).
