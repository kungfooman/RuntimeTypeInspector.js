# JSDoc typing tricks

This file records the JSDoc patterns that actually work in this repo (checked with `npx tsc --noEmit --allowJs --checkJs --strict`, jsconfig has `strict: true`). Each rule states what to do, why it works, and where the proof lives. When a rule is empirical (observed but unexplained), it says so, with a repro.

## Default to `node is T` predicates; casts are the last resort

Whenever a check needs to narrow a typedef union for later use, write a type predicate (`@returns {node is T}`) instead of a cast or a bare boolean helper. Predicates work in checkJs, they carry the proof once instead of scattering casts, and call sites read as plain `if`s with no annotations. The anonymous structural form (`@returns {x is {optional?: boolean}}`) is allowed when no named typedef fits. A predicate earns its place by replacing two or more casts or checks; a single-site, single-use narrowing stays inline (see the fallback at the end of the untagged-union section). Every predicate ships with the same one-function-per-file treatment as any helper: JSDoc `@example`, its own `<name>.spec.js` (including a stub-out bite test), barrel export, and `test_runtime.js` wiring.

## Import shared typedefs once per file with `@import`

```js
/** @import {ExpandedType, ExpandAnnotatedAtomNode} from './expandedType.js' */
/** @type {ExpandAnnotatedAtomNode} */ ({type: 'atom', atomType, optional})
```

never `@type {import('./expandedType.js').ExpandAnnotatedAtomNode}` inline. The inline form repeats the module path on every cast, so renaming or moving the typedef module touches every line; the `@import` form touches one line. `@import` needs TS 5.5 or later (repo has 5.9) and one lint allowance, because `eslint-plugin-jsdoc` does not know the tag out of the box:

```js
"jsdoc/check-tag-names": ["error", {"definedTags": ["import"]}],
```

`.eslintrc.cjs` carries that allowance. Pre-existing files outside the converted set still use inline imports; convert on touch.

## A declared `@returns` checks every object literal for free

If the function declares `@returns {ExpandedType | undefined}`, every `return ({...})` is checked against the union with no cast. The cast adds nothing: tsc verifies the literal either way, and removing the cast changes no verdict. Proof: stripping all 45 return-position casts across `expandType.js` and `expandTypeBabelTS.js` left tsc clean, except for three sites where the cast had been hiding a real hole (see below). Prefer the bare literal; reserve casts for sites tsc cannot prove (untagged unions, external ASTs).

## A cast that silences tsc may hide a real hole: delete it and read the error

`return /** @type {ExpandedType} */ ({type: 'union', members: [t, 'null']})` passed tsc while `t` was `ExpandedType | undefined`, embedding `undefined` in a non-optional `members` slot at runtime. Removing the cast surfaced `TS2322`. Rule: when a cast wraps a value the callee may leave `undefined`, try deleting the cast first. If tsc stays clean, the cast was noise. If tsc errors, the error names the hole; fix the hole rather than restoring the cast (at the time: guard and propagate, or fail fast with `'transpiler-error'`; the policy has since moved on to defaulting the miss to `any`, see below). Eight such holes were fixed this way across the nullable, mapping, template-span, condition, indexed-access, rest, parameter, named-tuple, function, record, reference, union, intersection, tuple, and object paths; the full log is in the `any`-policy section.

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

## Every union member carries a literal `type` tag: narrow by discriminant

Every `ExpandedType` member carries a literal `type` discriminant, including the two shapes that used to be tagless: `ExpandParameterNode` is `{type: 'parameter', paramType, name}` and `ExpandAnnotatedAtomNode` is `{type: 'atom', atomType, ...}`. The value slot had to move (`type` was already taken by the value), so the tag and the value never share a key. Discriminant checks narrow the full union with no predicate, no `in`, no cast:

```js
if (out.type === 'array' && out.elementType) {
  out.elementType = simplifyType(out.elementType);
}
```

The old `in`-based predicates below are kept where they answer a cross-shape question no single tag answers (`isExpandedObject`: any flag-carrying object node vs. a bare atom). Kind-only checks inline to `===`. Historical note: before the tags landed, the two tagless members defeated every discriminant check, so `simplifyType.js` used nine `'key' in out` probes, `isUnionNode` checked `'members' in node` first and carried the only sanctioned in-predicate cast, and `isIndexSignatureNode` verified tag plus structural keys with `in`. All of that retired with the tags.

## Untagged union members defeat narrowing: verify shape with a predicate (historical: retired by tagging)

Before every member carried a tag, `ExpandParameterNode` (`{type, name}`) and `ExpandAnnotatedAtomNode` (`{type, optional}`) carried no literal tag, so no discriminant check could exclude them. The `in`-based predicate pattern below was the replacement for a documented cast at the push site; it is kept here as the record of what the tags retired.

## Structural flag writes go through a predicate, not a cast

`typeof` narrowing does not survive JSDoc typedef unions: narrowing `ExpandedType` (or even a single `ExpandArrayNode | string`) by `typeof x === 'object'` yields `never`, so every flag write needed a `/** @type {{optional?: boolean}} */` cast. The fix is one type predicate used at all seven sites:

```js
/**
 * @param {ExpandedType | undefined} type - The expanded type to check.
 * @returns {type is Exclude<ExpandedType, string | number | boolean | undefined>} Whether the type is a flag-carrying object node.
 */
function isExpandedObject(type) {
  return typeof type === 'object' && type !== null;
}
```

`x is T` predicates work in checkJs. The `Exclude` form matters: the old anonymous `{optional?, readonly?}` return erased the union, so `out.type === '...'` after the guard narrowed nothing; `Exclude` keeps every member, and discriminant checks narrow from there. Call sites read naturally (`if (isExpandedObject(type)) type.optional = true;`) with no cast. The predicate lives in `src-transpiler/isExpandedObject.js` with its own spec, exported from the barrel. Side benefit found by testing: the old `instanceof Object` check in `annotateOptional.js` missed prototype-less nodes (`Object.create(null)`); the predicate handles them. Do not use `instanceof Object` for narrowing JSDoc unions: it errors on atom-including unions (`TS2358`) and narrows backwards where it applies.

## `in`-based predicates were the tagless-era workaround (retired by tagging)

When discriminant checks could not exclude the tagless members, the index-signature push verified tag plus structure with `in`, which narrowed untagged members where `===` could not. Kept as the historical record; new code narrows by discriminant (see above).

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
    Array.isArray(type.indexParameters)
  );
}
```

No cast inside or at the call sites (`if (isIndexSignatureNode(indexSignature)) indexSignatures.push(indexSignature);`). `src-transpiler/isIndexSignatureNode.js`, spec alongside, barrel-exported. The `Array.isArray` on `indexParameters` (not a bare `in` probe) keeps the `simplifyType` map total over corrupt shapes: simplify first, then the guard runs last so the assignment narrows with no cast and a mangled entry drops out instead of landing in the slot.

The old in-predicate cast in `isUnionNode` (tag plus `Array.isArray` check as proof, cast only reading through what untagged members hid) retired with the tags: `node.type === 'union' && Array.isArray(node.members)` narrows with no cast.

## What stays cast, and why

After the cleanup the remaining casts each survived a delete-and-watch-tsc-fail round:

 * Declaration casts on incrementally built objects (`ExpandMappingNode`, `ExpandObjectNode`, `ExpandedType[]`, `Record<...>` containers, the `'-' | '+' | '?'` modifier locals which widen to `string` without them). They state the construction target; the properties inside must still be honestly typed (guarded, never cast).
 * The widened tag literals in the dep-free parser (`{type: 'parameter', ...}` object literals infer `type: string`): `{type: /** @type {const} */ ('parameter'), ...}` at the push site is load-bearing, same class as the declaration casts.
 * `simplifyType.js` had an index-signature cast asserting the shape-preserving invariant; the tags plus guard-last ordering retired it (see above).
 * External untyped inputs: the Babel `parse()` result is `any`, so the synthesized-alias read needed no cast at all; where the parser lib IS typed (`Statement`), a kind guard (`first.type !== 'TSTypeAliasDeclaration'` throws) beats the old blind cast and fails closed.

## Unrepresentable innards default to `any`, never `undefined`

Every inner slot of every node shape uses an `OrAny` wrapper (`toSourceTSOrAny`, `toSourceBabelTSOrAny`, `expandTypeDepFreeOrAny`, `expandTupleElementOrAny`, `toBabelParameterOrAny`, `toBabelIndexParameterOrAny`) instead of a bare expander call, so no `undefined` ever lands in a shape. Rationale, in order:

* tsc reads unknown JSDoc parts as `any` (notably `?`), so `any` is the tsc-agreeing miss value; verified per input by `test/parity/cases/unparseable-innards.mjs` (tsc oracle, 9 cases).
* The runtime validates `any` without crashing; `undefined` in a slot crashes `validateType` (`Array<?>` threw `TypeError` reading properties of `undefined`) or crashes the Asserter downstream (`simplifyTypeToSource(undefined)`).
* Only structurally broken lists (malformed parameter lists) still bail the whole node via `undefined`, and only where the caller already handles it.
* Degenerate empty fragments (`''`, from `?` operands) become `any` inside the `OrAny` wrappers; bare `?` (missing or empty operand) is `any` itself, not a null-union (the TS `JSDocNullableType` case returns early on an empty operand, dep-free short-circuits `?`/`''` at the top). Both `Array<?>` and `string | ?` then agree exactly.

Unnamed optional tuple elements (`[string, number?]`) are the exception that proves the rule: tsc parses them as proper optional members (`[string, (number | undefined)?]`), so all three parsers build `{type: 'tupleMember', name: '', elementType, optional: true}` instead of defaulting. Garbage tsc cannot parse at all (`keyof ?`, `typeof ?` are file-level syntax errors) is covered behaviorally where possible and documented where the parsers structurally differ.

## Check order in the dep-free parser follows TS binding, not source order

`expandTypeDepFree` checks in this order: conditionals, unions/intersections, `keyof`, nullable, then everything else (`typeof` stays after nullable). The order encodes TS operator binding, which the shape must mirror:

* Postfix `?` binds tightest (except for `typeof`, where TS binds it loosest — so `keyof` moved before nullable but `typeof` stayed after; moving it regressed `typeof X?` agreement and was reverted).
* Prefix `?` binds loosest, so the union/intersection split is skipped for leading-`?` inputs (`?A|B` nullables the whole union).
* Moving the split before nullable fixed `string | ?`, `keyof T?`, and `A & B?` nesting agreement; each move was verified against the 52-probe agreement and the full gate, and the one that regressed (`typeof`) was reverted the same session. When reordering checks, re-run the parity spec first: it fails structurally on the first wrong move.

## Observed: `.map()` over `ts.NodeArray` neither types its callback nor checks its result (empirical)

```js
const members = node.types.map(toSourceTS); // NodeArray: no contextual param type, lenient result
const members = plain.map((_) => f(_)); // string[]: param typed, result strictly checked
```

In checkJs, `.map()` on `ts.NodeArray` does not provide a contextual parameter type to arrow callbacks (bare `(_)` errors `TS7006`), while `.map()` on plain arrays does. Conversely, a `NodeArray.map` result containing `ExpandedType | undefined` assigns into node slots without complaint, while the identical shape from a plain-array `.map` errors `TS2322`. `NodeArray` declares no `map` override (it inherits `ReadonlyArray.map`), so no mechanism is known; treat as observed checkJs behavior. Practical consequences:

* Prefer direct function references (`.map(toSourceTSOrAny)`) over arrows: they dodge the missing-context problem entirely.
* Arrows that need logic (optional-tuple detection) carry an inline `/** @param {ts.TypeNode} el */` JSDoc comment.
* `.includes(undefined)` guards after a `NodeArray.map` are runtime-correct but tsc-vacuous (tsc already believes the array is clean); the `?? 'any'` / `OrAny` policy makes the check structural instead of advisory.

## Keep the parser trio symmetric when touching one

`expandType.js`, `expandTypeBabelTS.js`, and `expandTypeDepFree.js` must agree wart for wart (unnamed optional tuple elements become `{type: 'tupleMember', name: '', elementType, optional: true}` in all three; unrepresentable innards default to `any` in all three). Every guard added to one parser was mirrored in the other two, and the hostile-input probe checks all three on the same inputs. A fix in one parser that changes a shared shape without mirroring it is a parity regression, caught by `expandTypeParity.spec.js` and the 52-probe agreement check.
