# JSDoc typing tricks

This file records the JSDoc patterns that actually work in this repo (checked with `npx tsc --noEmit --allowJs --checkJs --strict`, jsconfig has `strict: true`). Each rule states what to do, why it works, and where the proof lives. When a rule is empirical (observed but unexplained), it says so, with a repro.

## Import shared typedefs once per file with `@import`

```js
/** @import {ExpandedType, ExpandAnnotatedAtomNode} from './expandedType.js' */
/** @type {ExpandAnnotatedAtomNode} */ ({type, optional})
```

never `@type {import('./expandedType.js').ExpandAnnotatedAtomNode}` inline. The inline form repeats the module path on every cast, so renaming or moving the typedef module touches every line; the `@import` form touches one line. `@import` needs TS 5.5 or later (repo has 5.9) and one lint allowance, because `eslint-plugin-jsdoc` does not know the tag out of the box:

```js
"jsdoc/check-tag-names": ["error", {"definedTags": ["import"]}],
```

`.eslintrc.cjs` carries that allowance. Pre-existing files outside the converted set still use inline imports; convert on touch.

## A declared `@returns` checks every object literal for free

If the function declares `@returns {ExpandedType | undefined}`, every `return ({...})` is checked against the union with no cast. The cast adds nothing: tsc verifies the literal either way, and removing the cast changes no verdict. Proof: stripping all 45 return-position casts across `expandType.js` and `expandTypeBabelTS.js` left tsc clean, except for three sites where the cast had been hiding a real hole (see below). Prefer the bare literal; reserve casts for sites tsc cannot prove (untagged unions, external ASTs).

## A cast that silences tsc may hide a real hole: delete it and read the error

`return /** @type {ExpandedType} */ ({type: 'union', members: [t, 'null']})` passed tsc while `t` was `ExpandedType | undefined`, embedding `undefined` in a non-optional `members` slot at runtime. Removing the cast surfaced `TS2322`, and the honest fix propagates the miss (`if (t === undefined) { return undefined; }`) instead of asserting it away. Rule: when a cast wraps a value the callee may leave `undefined`, try deleting the cast first. If tsc stays clean, the cast was noise. If tsc errors, the error names the hole; fix the hole (guard and propagate, or fail fast with `'transpiler-error'`) rather than restoring the cast. Three such holes were fixed this way in the nullable, mapping, template-span, condition, indexed-access, rest, parameter, and named-tuple paths. `npm test` plus the hostile-input probe (`Array<?>`, `[string, ?]`, `{$K in ?}: number}` across all three parsers) confirm no new divergence; the remaining DIFFERs are pre-existing parser limitations, verified by stash.

## Declaration casts on built-up objects are load-bearing: keep them

```js
/** @type {ExpandMappingNode} */
const out = {
  type: 'mapping',
  ...
};
out.question = ...;
```

Without the declaration cast the literal widens (`type: string`), so later assignments (`out.question`, `out.nameType`, indexed pushes) fail with `TS2339`/`TS7053`. Proven by delete-and-watch-it-fail. The declaration cast sets the construction context; the properties inside it must still be honestly typed (guarded, not cast: see previous rule).

## Untagged union members defeat narrowing: verify shape with a predicate (was: cast once with a comment)

`ExpandedType` members `ExpandParameterNode` (`{type, name}`) and `ExpandAnnotatedAtomNode` (`{type, optional}`) carry no literal `type` tag, so no discriminant check can exclude them. This used to require a documented cast at the push site; the `in`-based `isIndexSignatureNode` predicate above retires that pattern: verify tag plus structural keys, no cast anywhere. The old advice (narrow past the untagged members, then cast with a comment recording the proof) remains the fallback only when a predicate is disproportionate (single site, no shared meaning).

## Structural flag writes go through a predicate, not a cast

`typeof` narrowing does not survive JSDoc typedef unions: narrowing `ExpandedType` (or even a single `ExpandArrayNode | string`) by `typeof x === 'object'` yields `never`, so every flag write needed a `/** @type {{optional?: boolean}} */` cast. The fix is one type predicate used at all seven sites:

```js
/**
 * @param {ExpandedType | undefined} type - The expanded type to check.
 * @returns {type is {optional?: boolean, readonly?: boolean}} Whether the type is a flag-carrying object node.
 */
function isExpandedObject(type) {
  return typeof type === 'object' && type !== null;
}
```

`x is T` predicates work in checkJs, and the structural claim is honest: every object node carries those flags. Call sites read naturally (`if (isExpandedObject(type)) type.optional = true;`) with no cast. The predicate lives in `src-transpiler/isExpandedObject.js` with its own spec, exported from the barrel. Side benefit found by testing: the old `instanceof Object` check in `annotateOptional.js` missed prototype-less nodes (`Object.create(null)`); the predicate handles them. Do not use `instanceof Object` for narrowing JSDoc unions: it errors on atom-including unions (`TS2358`) and narrows backwards where it applies.

## Untagged union members yield to `in`-based predicates, not casts

Discriminant checks cannot exclude `ExpandParameterNode`/`ExpandAnnotatedAtomNode` (no literal tag), so the index-signature push needed a documented cast. The replacement verifies tag plus structure with `in`, which narrows untagged members where `===` cannot:

```js
/**
 * @param {ExpandedType | undefined} type - The expanded type to check.
 * @returns {type is ExpandIndexSignatureNode} Whether the type is an index signature node.
 */
function isIndexSignatureNode(type) {
  return (
    typeof type === 'object' &&
    type !== null &&
    type.type === 'indexSignature' &&
    'indexType' in type &&
    'indexParameters' in type
  );
}
```

No cast inside or at the call sites (`if (isIndexSignatureNode(indexSignature)) indexSignatures.push(indexSignature);`). `src-transpiler/isIndexSignatureNode.js`, spec alongside, barrel-exported. Same pattern applies wherever an untagged member defeats `===` narrowing: check the tag if present, then the structural keys with `in`.

## What stays cast, and why

After the cleanup the remaining casts each survived a delete-and-watch-tsc-fail round:

* Declaration casts on incrementally built objects (`ExpandMappingNode`, `ExpandObjectNode`, `ExpandedType[]`, `Record<...>` containers, the `'-' | '+' | '?'` modifier locals which widen to `string` without them). They state the construction target; the properties inside must still be honestly typed (guarded, never cast).
* The `ExpandAnnotatedAtomNode` wrap and the tuple `(ExpandedType | undefined)[]` pair in `expandTypeDepFree.js`: the tuple wart (`undefined` for unnamed `?` elements) is deliberate three-parser parity, not a hole.
* `simplifyType.js` index-signature map: asserts the shape-preserving invariant by construction; verifying per call would be dead-code paranoia, filtering would silently drop corruption (fail-open).
* External untyped inputs: the Babel `parse()` result is `any`, so the synthesized-alias read needed no cast at all; where the parser lib IS typed (`Statement`), a kind guard (`first.type !== 'TSTypeAliasDeclaration'` throws) beats the old blind cast and fails closed.

## Observed: `.map()` over `ts.NodeArray` assigns cleanly, over plain arrays it does not (empirical)

```js
const members = node.types.map(toSourceTS); // node.types: ts.NodeArray<ts.TypeNode>
return ({type: 'union', members}); // clean, no cast needed
```

The same shape over a plain array errors:

```js
/** @param {string[]} plain - Probe. @returns {ExpandedType | undefined} probe */
export function probePlain(plain) {
  const m = plain.map(conv); // conv returns ExpandedType | undefined
  return ({type: 'union', members: m}); // TS2322: undefined not assignable
}
```

while the `NodeArray` version with the identical callback passes. `NodeArray` declares no `map` override (it inherits `ReadonlyArray.map`), so no mechanism is known; treat as an observed checkJs behavior, not a rule to lean on. Practical consequence: tuple, union, and intersection element arrays built by `.map()` over `ts.NodeArray` need no cast and get none; do not "fix" them by adding casts, and do not copy the pattern to plain arrays expecting the same leniency. If tsc ever tightens this, the declared `@returns` will flag every site at once.

## Keep the parser trio symmetric when touching one

`expandType.js`, `expandTypeBabelTS.js`, and `expandTypeDepFree.js` must agree wart for wart (unnamed optional tuple elements stay `undefined` in all three; unparseable parts propagate `undefined` in all three). Every guard added to one parser was mirrored in the other two, and the hostile-input probe checks all three on the same inputs. A fix in one parser that changes a shared shape without mirroring it is a parity regression, caught by `expandTypeParity.spec.js` and the 52-probe agreement check.
