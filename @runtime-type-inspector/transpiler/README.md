Transpiler package for `runtime-type-inspector`.

This is implementing the source code transformation, generating code eventually executed in combination with `@runtime-type-inspector/runtime`.

## CLI

After installing, two commands are available via `npx`:

- `transpiler <file.js>` - insert runtime type-checking assertions for the JSDoc types in a file.
- `ts2js <file.ts>` - convert a TypeScript file into plain ESM JavaScript with the types preserved as JSDoc comments (no transpilation step needed afterwards).

## `ts2js`

Converts TypeScript into `.js` + JSDoc. Type-only imports become `@import` comments
(`import type {Foo} from './foo'` -> `/** @import { Foo } from './foo.js' */`), so no
runtime import is emitted. The common TypeScript surface is covered (functions,
interfaces/aliases, enums, generics, classes including `implements`, unions, tuples,
rest params, TSX, `import = require`); `namespace` blocks are converted to the classic
IIFE pattern (`var N; (function (N) { ... })(N || (N = {}));`). See `test/ts2js.mjs`
for the exact snapshot coverage.

The conversion preserves types but does not verify them - runtime validation is still
provided by `@runtime-type-inspector/runtime` via `addTypeChecks`.