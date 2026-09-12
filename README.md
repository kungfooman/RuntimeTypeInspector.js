# `RuntimeTypeInspector.js` - your personal type-checking assistant 🕵️🐞🐛

`RuntimeTypeInspector.js` alongside `JSDoc` is a powerful tool which works in tandem with `Babel.js` and `TypeScript` to generate type-asserting JavaScript files. Assertion code is injected into debug builds to perform runtime type checking of each function and method at runtime - a step which is required beyond pure static typing to help emerge the Incident Management Lifecycle.

The Incident Management Lifecycle is:
 - Identify - recognize the type incidents
 - Respond - debugging in F12/DevTools
 - Resolve - once the issue is cognized it's resolvable
 - Learn - clarify the issue for yourself and share with others

`RuntimeTypeInspector.js` is supporting Identify and Respond of the IML.

# Why is this technology critical?

This technology is critical because it provides developers with an organized method to ensure type safety with runtime type issue reports while improving code organization, type safety and documentation - making it easier for other developers to understand the code and enforce good coding standards.

RuntimeTypeInspector.js assists the debugging process, since it has a clear definition of what each function expects while issuing warnings, which can act as breakpoints in your source code (as shown in the example debugging session in my showcase video). Finally, good JSDoc can make the entire code base more maintainable, since it's easier for developers to find the specific parts of the code they need to change quickly and easily.

# Watch our Example Usage Videos!

If you want to see how our product works, take a look at the videos we have prepared. They show you exactly how to use our product with ease.

**Presentation hunting down a `NaN` bug in the PlayCanvas engine:**

https://www.youtube.com/watch?v=o5ipQe2rVKQ

[![hunting down NaN bug in PlayCanvas](https://img.youtube.com/vi/o5ipQe2rVKQ/0.jpg)](https://www.youtube.com/watch?v=o5ipQe2rVKQ)

**Another demonstration fixing `NaN` bugs in the PlayCanvas Volumetric Video project:**

https://www.youtube.com/watch?v=xOp3YWU6M1g

[![volumetric video bug fixing](https://img.youtube.com/vi/xOp3YWU6M1g/0.jpg)](https://www.youtube.com/watch?v=xOp3YWU6M1g)

# Migrate legacy TypeScript to ESM once and for all: `ts2js`

`ts2js` migrates legacy TypeScript projects to plain ESM JavaScript in one pass. The types are moved into JSDoc comments, TypeScript is removed from the pipeline entirely, and you then continue with beautiful modern ESM + import maps - no transpilation step, no build step, no `tsconfig` to feed it.

```sh
npx ts2js src/player.ts > src/player.js
```

For example, this TypeScript:

```ts
import type {Vec3} from './math';
export function add(a: Vec3, b: Vec3): Vec3 {
  return {x: a.x + b.x, ...};
}
```

becomes this plain JavaScript:

```js
/** @import { Vec3 } from './math.js' */
/**
 * @param {Vec3} a
 * @param {Vec3} b
 * @returns {Vec3}
 */
export function add(a, b) {
  return {x: a.x + b.x, ...};
}
```

Type-only imports are preserved as `@import` comments instead of runtime imports, so no code is emitted for them, and `.ts` extensions in relative import paths are rewritten to `.js`.

Being honest about what it is:

- It converts the common TypeScript surface: functions with parameters/returns, interfaces and type aliases (`@typedef`), enums, generics (`@template`), classes including parameter properties and `implements` (`@implements`), tuples, unions, rest parameters, default-value inference, TSX, `import x = require('...')` and `import('./x').T` type references. `namespace` blocks become the classic IIFE pattern with `Namespace.member = member` assignments and namespace-qualified types reduced to their local identifier.
- It is **not** a complete TypeScript compiler. The snapshot suite in `test/ts2js.mjs` documents exactly what is currently covered.
- `ts2js` preserves types, it does not verify them. Runtime validation via `addTypeChecks` / `@runtime-type-inspector/runtime` is a separate, optional development-time aid - a crutch for live debugging, not something you ship.
- You can keep authoring in TypeScript for as long as you like and still run `tsc --noEmit` for static checking; `ts2js` simply makes that optional. The migration can happen file by file or full-project, and after it completes the `.ts` sources are just historical artifacts.

The point of the one-time migration: a legacy TypeScript library becomes native ESM JavaScript that runs directly in the browser, while the JSDoc types keep all the editor hints and documentation (and keep working for TypeScript consumers, who can still get their types from the existing `.d.ts` files). From then on, no transpilation is ever needed again.

The runtime assertions (`transpiler`) are a development-time aid and are not meant to be shipped. For example, static checking is blind to this bug:

```js
const arr = [10, 20, 1, 2, 3]; // number[]
arr.length = 10;                // still number[] according to static types
let sum = 0;
for (let i = 0; i < arr.length; i++) {
  sum += arr[i];                // arr[3] and beyond are now undefined -> NaN
}
console.log('sum', sum);
```

The `ts2js` rewriting phase obviously cannot catch this - it is a runtime-semantics problem, not a syntax or type-level one. That is exactly what the dev loop is for: convert the file, eval it with runtime assertions, and the inspector flags the offending calls as they happen:

```text
add  b  "number"  undefined   The 'b' argument has an invalid type.
add  a  "number"  NaN         The 'a' argument has an invalid type. value is NaN
```

Static checking trusts both `arr.length = 10` and `arr[i]`; the bug only emerges when real values flow through at runtime. Every loop iteration passing `undefined` or `NaN` into `add` is reported live in the debugging session - the kind of thing static file-based checking is blind to.

# Installation

Please take my two Pull Requests for [Transformers.js](https://github.com/xenova/transformers.js/pull/409) (using Webpack) and [PlayCanvas](https://github.com/playcanvas/engine/pull/5817) (using Rollup) as example.

```
npm install @runtime-type-inspector/transpiler
```

Live demo: https://runtimetypeinspector.org/

Thank you for reading and testing! You can also open DevTools and run:

```js
console.log(rtiTranspiler)
```

# Available NPM packages

- https://www.npmjs.com/package/@runtime-type-inspector/runtime
- https://www.npmjs.com/package/@runtime-type-inspector/transpiler
- https://www.npmjs.com/package/@runtime-type-inspector/plugin-parcel1
- https://www.npmjs.com/package/@runtime-type-inspector/parcel-transformer (Parcel v2)
- https://www.npmjs.com/package/@runtime-type-inspector/plugin-rollup
- https://www.npmjs.com/package/@runtime-type-inspector/plugin-webpack (version independent)
- https://www.npmjs.com/package/@runtime-type-inspector/plugin-webpack4
- https://www.npmjs.com/package/@runtime-type-inspector/plugin-webpack5

# Acknowledgements

We are incredibly grateful for the support and contribution of our funders, [Sovereign Tech Fund](https://www.sovereigntechfund.de/). We would like to thank them for their support and contribution towards making this project possible. Their partnership and generous funding have been instrumental in the success and realization of [RuntimeTypeInspector.js](https://github.com/kungfooman/RuntimeTypeInspector.js).

![stf-logo-1-light-background](https://github.com/user-attachments/assets/118e457e-cda4-49cc-ae63-2452c49313e7)

> Open source, a treasure trove for all to embrace,
> 
> But its potential is limited, without financial grace.
> 
> Let's urge our governments, to invest in its light,
> 
> For a resilient digital infrastructure, shining bright.
