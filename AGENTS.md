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

For playground counter-checks, enable `checkJs` plus `Strict` *and*
`strictNullChecks` explicitly (the Strict toggle alone has been observed
not to imply it). The tower fixtures reproduce either way — verified with
`--strict`, without it, and with `--strict --strictNullChecks false`.

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
  E.g. `class-templates-input.mjs` for issue #265. Keep fixture base
  classes realistic (non-empty, like the engine's): tsc reads an empty
  `class C {}` structurally, so every member would extend it and
  TypeScript-playground counter-checks would diverge from RTI's nominal
  class checks.
- Spec: `src-transpiler/<name>.spec.js` (or `src-runtime/`) in repo style
  (sync boolean tests, `export const tests`), wired into `test_runtime.js`.
  Cover the transpiler output AND creative variants of your own: edge cases
  the repro didn't show (export wrappers, template shadowing, bare
  templates, widening vs warns at runtime).
- Expectation file: `test/typechecking/<name>-errors.json`
  (`{"throws": [{loc, name[, value]}, ...]}` in call order) pins exactly
  which calls must throw; the optional `value` is the offending argument
  (canonical JSON), so repeated calls to one function stay distinguishable
  by what they threw, not just by order. `test/jsdoc-expect/run.mjs`
  (`npm run test:jsdoc-expect`, part of `npm test`) compares it against
  `run-jsdoc.js` output, failing on any missing or extra error. Fixture inputs stay clean JS with no markers.
  Call lines may additionally carry `// Expected: ...` notes for humans
  (e.g. for TypeScript-playground counter-checks); they are documentation
  only and ignored by the runner. Newer fixtures mark throwing calls with
  `// @ts-expect-error` instead, which doubles as a tsc-strict
  self-check — but a `//` line starting with it is live to tsc, so prose
  must never start a line with that token. Cases that flip with
  `strictNullChecks` live apart in
  `playcanvas-tower-strictnull-input.mjs` with per-setting expectations
  in comments.
- Prove the tests bite: stash the fix and show they fail, pop and show green.
- Every unit test gets a comment stating its expectation up front; then
  verify it (mutation: break the code, watch it fail) and fix whatever is
  wrong — test or code — until the expectation holds for the right reason.
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

## One function per file

Each `src-runtime/` helper module holds exactly one function, named after its file (e.g. `stripKey` lives in `src-runtime/stripKey.js`), plus only the module-local constants that function directly needs (e.g. its memoization cache).
- Every extracted helper carries a JSDoc block with a runnable `@example` showing a representative call and its result, so each module documents itself.
- When extracting: move the function as-is (no behavior changes), point the old module's import at the new file, add an `export * from './<name>.js';` line to `src-runtime/index.js`, update any specs importing from the old path, and finish with the full gate (`npm test` + `npm run lint`).
- Exception: `src-runtime/jsx.js` stays whole (`genJsx`, `appendChildren` and the tag factories live together) because the factories call `appendChildren` and splitting them only trades a working module for a circular import.

## Markdown style

In every Markdown file you write, never hard-wrap prose with `\n`: each paragraph is a single line and each list item is a single line — text-wrapping is the reader's job (soft-wrap), not the file's. Hard-wrapped lines force manual re-wrapping on every edit and noise up diffs. Code blocks keep their line breaks; nothing else gets any.

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
