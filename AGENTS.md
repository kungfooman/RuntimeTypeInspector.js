# AGENTS.md

## Commits

Never commit, amend, push, or open pull requests unless the user explicitly
asks for it ("commit", "push", "open a PR", and the like). Do the work,
leave it staged or unstaged in the working tree, and report what changed.
When a commit is requested, inspect `git status` and `git diff` first, stage
only the intended files, and write the message in the established repo style.

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
- Every unit test carries a plain-English comment saying what it wants to
  test and why the outcome should be the way it is, so the intent is
  readable without reverse-engineering the assertion.
- Full gate before finishing: `npm test` + `npm run lint`.

## Break your own code

The reported repro is the starting line, never the finish: every fix or feature must survive actively hostile testing before it lands. Invent nasty, complicated scenarios around the changed code (deep nesting, unions of edge cases, nullable and optional positions, template interplay and shadowing, recursive types, cross-file imports, every spelling of the construct you touched) and run each one through both RTI (`node run-jsdoc.js`) and `tsc --strict` on the same file. Close every divergence: either fix RTI until it groks the construct, or document it as deliberate in the fixture header (sparse-array precedent) with the tsc verdict noted. Promote every divergence you close into the permanent pipeline above (fixture + spec + errors file), so the suite keeps what you learned. Goal: perfect typing agreement — the only acceptable surprises are the ones tsc also reports.

## Test style

Keep functions short enough to document in one JSDoc block: when a branch
needs its own explanation plus its own edge cases, it is a helper in its own
module (one function per file), with its own `@example` and its own spec.
Inline ternaries and `?.`/`??` chains do not scale past one level: a nested
ternary or a line that needs 130+ characters to say what it does is a branch
the reader cannot see, so it becomes two named branches instead. The rule of
thumb is one decision per line: if a line picks between three shapes or
merges three flag sources, split it until each line does one thing a comment
can name. `npm run lint` does not enforce this; review does.

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

Wrap multi-condition boolean returns in parens with one condition per line, so diffs stay per condition and long chains stay scannable:

```js
return (
  someLongCheck() === true &&
  someOtherCheck() === true
);
```

Import each shared typedef once per file with `@import` at the top and use the bare name everywhere else, so `@type` casts stay short and diffs stay local:

```js
/** @import {ExpandedType, ExpandAnnotatedAtomNode} from './expandedType.js' */
/** @type {ExpandAnnotatedAtomNode} */ ({type: 'atom', atomType, optional})
```

never `@type {import('./expandedType.js').ExpandAnnotatedAtomNode}` inline.

See `JSDOC.md` for the full set of JSDoc typing tricks. The default
pattern is `node is T` predicates: when a check must narrow a typedef
union for later use, write a predicate instead of a cast or a bare
boolean helper. Which casts are redundant (declared `@returns` checks
literals for free), which are load-bearing (declaration casts on
built-up objects, one documented in-predicate read), how to turn a
silencing cast into a real fix (delete it, read the `TS2322`, guard the
hole or default the miss to `any`), and the empirical
`ts.NodeArray.map` leniency with its repro.

## Comment style

Do not add issue-number references (e.g. `(issue #123)`) to code comments,
JSDoc blocks, or specs. Describe the why in plain words instead; the commit
message / PR is the place for issue links. Pre-existing references stay
untouched — just don't introduce new ones.

Write comments, commit messages and prose in plain proper English with plain
ASCII punctuation only: no unicode decorations (em dashes, curly quotes,
arrows), and do not sprinkle hyphens and dashes everywhere; use normal
sentences with regular word spacing instead.

## Fail closed

Safety relevant flags (option switches, validation verdicts, capability checks) must fail closed: a missing, undefined or garbage value disables the behavior, never enables it. Read a flag with plain truthiness (`if (options.checkStats)`) when it flows straight into a branch, or compare `=== true` with a short comment when the verdict is stored in a local first. Never write `options.<flag> !== false`: that reads every non-`false` value, including `undefined` from a typo or a deleted key, as on, so a broken flag silently widens validation instead of narrowing it.

## One function per file

Each helper module in `src-runtime/` and `src-transpiler/` holds exactly one function, named after its file (e.g. `stripKey` lives in `src-runtime/stripKey.js`), plus only the module-local constants that function directly needs (e.g. its memoization cache). Spec files (`*.spec.js`) are exempt: they hold one test function per behavior under test.
- Every extracted helper carries a JSDoc block with a runnable `@example` showing a representative call and its result, so each module documents itself. When the example needs a complex type, build it through a real helper call (e.g. `expandType("number[]")`), never hand-write the internal object literal: hand-built literals rot when the shape changes and teach a construction path real code never uses. Plain literals stay literal: `deepEqualType({b: 1, a: 2}, {a: 2, b: 1})` needs no helper.
- Spec inputs follow the same split: build complex types through the parser (`expandType`), hand-write only trivial literals, and keep comparator specs decoupled from the parser (hand-built inputs fail for the right reason when the comparator regresses, not when the parser does).
- When extracting: move the function as-is (no behavior changes), point the old module's import at the new file, add an `export * from './<name>.js';` line to the package index (`src-runtime/index.js` or `src-transpiler/index.js`), update any specs importing from the old path, and finish with the full gate (`npm test` + `npm run lint`).
- Every helper module ships with a `<name>.spec.js` next to it (same style: sync boolean tests, `export const tests`, wired into `test_runtime.js`): a function lands only with a spec that fails when the function is stubbed out. Pre-existing spec-less modules are backlog, not precedent.
- Exception: `src-runtime/jsx.js` stays whole (`genJsx`, `appendChildren` and the tag factories live together) because the factories call `appendChildren` and splitting them only trades a working module for a circular import.

## Plugins

Optional runtime behavior ships as plugins, one folder per plugin at `src-runtime/plugin-<name>/` (e.g. `plugin-windowed/`, `plugin-walk-timers/`). A plugin folder holds the plugin entry, its private helpers, and each module's `<name>.spec.js` next to it; only genuinely shared infrastructure (`options.js`, `checkStats.js`, `validators.js`, the core validators) stays in the root. A plugin owns the option keys it introduces: it exports them as one plain data object that the root `options.js` splices into the shared object with `Object.assign`, so panels, workers and `setOptions` keep reading and writing the same `options` object with no changes on their side.
- Each plugin folder carries an `index.js` barrel of pure `export *` lines (same pattern as the package index), and the package index re-exports the barrel instead of the individual modules. Barrels hold no behavior.
- Plugin barrel exports must never collide: `export *` resolves a name clash by silently dropping the name from the namespace, so a collision is a quiet API loss with no error anywhere. When a plugin export would share a name with any other barrel export, rename it with the plugin prefix first (a windowing hook is `mapCheckWindowRecord`, never bare `record`). Re-run the namespace check below whenever a plugin barrel gains an export, so the rule stays verified instead of trusted.

```sh
node --input-type=module -e "import fs from 'node:fs'; const root = await import('./src-runtime/index.js'); const missing = []; for (const d of fs.readdirSync('src-runtime', {withFileTypes: true})) { if (!d.isDirectory() || !d.name.startsWith('plugin-')) { continue; } const barrel = await import('./src-runtime/' + d.name + '/index.js'); for (const k of Object.keys(barrel)) { if (!(k in root)) { missing.push(d.name + ': ' + k); } } } if (missing.length > 0) { console.error('shadowed barrel exports: ' + missing.join(', ')); process.exit(1); } console.log('no barrel collisions'); }"
```

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
