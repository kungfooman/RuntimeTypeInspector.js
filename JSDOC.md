# JSDoc typing tricks

This file records the JSDoc patterns that actually work in this repo (checked with `npx tsc --noEmit --allowJs --checkJs --strict`, jsconfig has `strict: true`). Each rule states what to do, why it works, and where the proof lives. When a rule is empirical (observed but unexplained), it says so, with a repro.

## Default to `node is T` predicates; casts are the last resort

Whenever a check needs to narrow a typedef union for later use, write a type predicate (`@returns {node is T}`) instead of a cast or a bare boolean helper. Predicates work in checkJs, they carry the proof once instead of scattering casts, and call sites read as plain `if`s with no annotations. The anonymous structural form (`@returns {x is {optional?: boolean}}`) is allowed when no named typedef fits. A predicate earns its place by replacing two or more casts or checks; a single-site, single-use narrowing stays inline (see the fallback at the end of the untagged-union section). Every predicate ships with the same one-function-per-file treatment as any helper: JSDoc `@example`, its own `<name>.spec.js` (including a stub-out bite test), barrel export, and `test_runtime.js` wiring.

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

## Untagged union members yield to `in`-based predicates, not casts (parseJSDoc's `isUnionNode` keeps one documented cast inside)

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

Where even `in` cannot reach (reading `.members` off a union whose tagless members lack the property, as in parseJSDoc's `isUnionNode`), one cast inside the predicate body is the honest minimum: the tag plus `Array.isArray` check is the proof, the cast only reads through what narrowing cannot see, and every call site stays cast-free. That is the single sanctioned in-predicate cast; anything wider goes back to a guard.

## What stays cast, and why

After the cleanup the remaining casts each survived a delete-and-watch-tsc-fail round:

* Declaration casts on incrementally built objects (`ExpandMappingNode`, `ExpandObjectNode`, `ExpandedType[]`, `Record<...>` containers, the `'-' | '+' | '?'` modifier locals which widen to `string` without them). They state the construction target; the properties inside must still be honestly typed (guarded, never cast).
 * The `ExpandAnnotatedAtomNode` wrap in `expandTypeDepFree.js` (the `{type, expanded}` construction widens without it).
 * `simplifyType.js` index-signature map: asserts the shape-preserving invariant by construction; verifying per call would be dead-code paranoia, filtering would silently drop corruption (fail-open).
 * External untyped inputs: the Babel `parse()` result is `any`, so the synthesized-alias read needed no cast at all; where the parser lib IS typed (`Statement`), a kind guard (`first.type !== 'TSTypeAliasDeclaration'` throws) beats the old blind cast and fails closed.
 * Inside predicate bodies, one documented cast may read through the exact gap the predicate closes (see `isUnionNode` below): the tag plus `Array.isArray` check is the proof, the cast only touches what untagged members hide from narrowing.

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
