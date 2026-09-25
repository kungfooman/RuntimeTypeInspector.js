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

## Test suite

```sh
npm test  # test:update (gen_tests.js) + test.js + test_runtime.js + jsdoc/ts2js/wat suites
npm run lint  # eslint over src-transpiler and src-runtime only
```

Note: `test.js` proves transpile parity only — a quiet `// warns` comment
passes it. Runtime behavior of fixtures is covered by `test_runtime.js`
specs (e.g. `src-runtime/templateNarrowing.spec.js`,
`src-runtime/collectCandidates.spec.js`).
