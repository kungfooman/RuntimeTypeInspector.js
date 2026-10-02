# AGENTS.md

## Scratch files

Always use the repo-local `./tmp/` directory for scratch, repro and
throwaway files — never the system `/tmp` (it triggers permission flow
blockers). `./tmp/` is git-ignored, so nothing there can leak into commits.
Create it on demand (`mkdir -p tmp`); do not store anything permanent there.

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

When the user hands you tests (repro files, `./tmp` snippets, demo cases), make them permanent instead of leaving them in `./tmp` — plus your own creative variants:

- Fixture: `test/typechecking/<name>-input.mjs` (+ `-output.mjs`,
  generated with the same pipeline as `test.js`) with `// ok` / `// warns:`
  runtime contracts; regenerate `test/typechecking.json` via `gen_tests.js`.
  E.g. `class-templates-input.mjs` for issue #265.
- Spec: `src-transpiler/<name>.spec.js` (or `src-runtime/`) in repo style
  (sync boolean tests, `export const tests`), wired into `test_runtime.js`.
  Cover the transpiler output AND creative variants of your own: edge cases
  the repro didn't show (export wrappers, template shadowing, bare
  templates, widening vs warns at runtime).
- Expectation file: `test/typechecking/<name>-errors.json`
  (`{"throws": [{loc, name}, ...]}` in call order) pins exactly which calls
  must throw; `test/jsdoc-expect/run.mjs` (`npm run test:jsdoc-expect`,
  part of `npm test`) compares it against `run-jsdoc.js` output, failing on
  any missing or extra error. Fixture inputs stay clean JS with no markers.
- Prove the tests bite: stash the fix and show they fail, pop and show green.
- Full gate before finishing: `npm test` + `npm run lint`.

## Test style

Never assert exact human-readable prose (diagnosis sentences, detail
messages, log hints, one-line descriptions). Prose is presentation: pinning
it turns every reword into a failing suite without any behavioral
regression. Assert machine-readable structure instead: finding
kind/path/expected/actual/children, node kinds/marks/paths, DOM
classes and presence — not sentences.

If the semantic you need is only visible in prose, add a structured field
first and test the field (e.g. a union finding carries `container:
'Set<string | number>'`; the sentence is then free to change). Locating a
row by its text to check *which* row highlights is fine — that tests
behavior, not wording.

## Comment style

Do not add issue-number references (e.g. `(issue #123)`) to code comments,
JSDoc blocks, or specs. Describe the why in plain words instead; the commit
message / PR is the place for issue links. Pre-existing references stay
untouched — just don't introduce new ones.

## Test suite

```sh
npm test  # test:update (gen_tests.js) + test.js + test_runtime.js + jsdoc-expect + jsdoc/ts2js/wat suites
npm run lint  # eslint over src-transpiler, src-runtime and src-unittest
```

Note: `test.js` proves transpile parity only — a quiet `// warns` comment
passes it. Runtime behavior of fixtures is covered by `test_runtime.js`
specs (e.g. `src-runtime/templateNarrowing.spec.js`,
`src-runtime/collectCandidates.spec.js`) and by `test/jsdoc-expect/run.mjs`:
a `<stem>-input.mjs` fixture with a sibling `<stem>-errors.json` states
exactly which calls must throw (`[{loc, name}, ...]` in execution order —
never message prose), and the runner fails on any missing or extra error.
