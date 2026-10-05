/**
 * Homomorphic Partial over indexed access: `{[K in keyof GizmoTheme]?: Partial<GizmoTheme[K]>}` (the transform-gizmo `setTheme` shape) used to reject every valid partial theme because `Partial` only accepted plain object typedefs. `Partial<GizmoTheme[K]>` instantiates per key to `Partial<mapping>` (shapeBase), `Partial<number>` (guideOcclusion) and `Partial<Color>` (disabled class): TypeScript keeps primitives as primitives, distributes over unions and turns object/class shapes optional with arrays staying arrays and tuples staying tuples. Every throwing call carries `@ts-expect-error`, so a tsc-strict run is green if and only if each directive is consumed and nothing else errors; `*-errors.json` pins the same sequence for RTI. Two deliberate divergences carry `// Expected:` notes instead: mixed-union literals like `{a, b}` against `Partial<A | B>` and class instances against `Pick<Class, ...>` are accepted structurally by tsc but rejected by RTI's exactObjects excess check (which `Omit`/`Pick` rejection relies on). Nested `>>>` closings are spaced (`> > >`) because tsc's JSDoc parser cannot lex them; RTI parses both spellings. Cross-file imports stay out of scope: RTI checks one file, so imported types are unknown while tsc follows them.
 */
class Color {
  constructor() {
    /** @type {number} */
    this.r = 0;
    /** @type {number} */
    this.g = 0;
    /** @type {number} */
    this.b = 0;
    /** @type {number} */
    this.a = 1;
  }
}
/**
 * @typedef {object} Small
 * @property {number} a
 * @property {string} b
 */
/**
 * @typedef {object} GizmoTheme
 * @property {{ [K in 'x' | 'y' | 'z' | 'f' | 'xyz']: Color }} shapeBase
 * @property {{ [K in 'x' | 'y' | 'z']: Color }} guideBase
 * @property {number} guideOcclusion
 * @property {Color} disabled
 */
/**
 * @param {{ [K in keyof GizmoTheme]?: Partial<GizmoTheme[K]> }} partial
 */
function setTheme(partial) {
  return partial;
}
setTheme({}); // ok: outer mapping is optional
setTheme({ guideOcclusion: 0.5 }); // ok: Partial<number> is number
setTheme({ shapeBase: { x: new Color() } }); // ok: deep partial of mapping
setTheme({ shapeBase: { x: new Color() }, guideOcclusion: 1 }); // ok: mixed
setTheme({ guideBase: { x: new Color() } }); // ok
setTheme({ disabled: new Color() }); // ok: full class instance fits Partial<class>
setTheme({ disabled: {} }); // ok: Partial<class> allows empty
// @ts-expect-error: string is not assignable to number
setTheme({ guideOcclusion: 'bad' });
// @ts-expect-error: number is not a Color
setTheme({ shapeBase: { x: 123 } });
// @ts-expect-error: unknown props are rejected
setTheme({ unknownProp: 1 });
/**
 * @param {Partial<number>} x
 */
function takeNumber(x) {
  return x;
}
takeNumber(1); // ok
// @ts-expect-error: empty object is not a number
takeNumber({});
/**
 * @param {Partial<Small | number>} x
 */
function takeUnion(x) {
  return x;
}
takeUnion(1); // ok: primitive member survives
takeUnion({ a: 1 }); // ok: partial object member
takeUnion({}); // ok
// @ts-expect-error: string is not assignable to number
takeUnion({ a: 'x' });
// @ts-expect-error: boolean matches neither member
takeUnion(true);
/**
 * @param {Required<Partial<Small>>} x
 */
function takeRequired(x) {
  return x;
}
takeRequired({ a: 1, b: 's' }); // ok
// @ts-expect-error: Required re-imposes missing props
takeRequired({});
/**
 * @param {Partial<string[]>} x
 */
function takeArray(x) {
  return x;
}
takeArray(['a']); // ok
takeArray(['a', undefined]); // ok: elements turn optional
// @ts-expect-error: plain object is not an array
takeArray({});
/**
 * @param {Partial<Color>} x
 */
function takeClass(x) {
  return x;
}
takeClass(new Color()); // ok
takeClass({}); // ok
takeClass({ r: 1 }); // ok: subset of class shape
// @ts-expect-error: string is not assignable to number
takeClass({ r: 'bad' });
/**
 * @param {Partial<Partial<Small> >} x
 */
function takeDouble(x) {
  return x;
}
takeDouble({}); // ok
takeDouble({ a: 1 }); // ok
// @ts-expect-error: string is not assignable to number
takeDouble({ a: 'x' });
/**
 * @param {Partial<Partial<Partial<Small> > >} x
 */
function takeTriple(x) {
  return x;
}
takeTriple({}); // ok
takeTriple({ b: 's' }); // ok
// @ts-expect-error: number is not assignable to string
takeTriple({ b: 1 });
/**
 * @param {Partial<Pick<Small, 'a'>>} x
 */
function takePartialPick(x) {
  return x;
}
takePartialPick({}); // ok
takePartialPick({ a: 1 }); // ok
// @ts-expect-error: string is not assignable to number
takePartialPick({ a: 'x' });
// @ts-expect-error: b was picked away
takePartialPick({ b: 's' });
/**
 * @param {Partial<Omit<Small, 'a'>>} x
 */
function takePartialOmit(x) {
  return x;
}
takePartialOmit({}); // ok
takePartialOmit({ b: 's' }); // ok
// @ts-expect-error: number is not assignable to string
takePartialOmit({ b: 1 });
// @ts-expect-error: a was omitted
takePartialOmit({ a: 1 });
/**
 * @typedef {object} Other
 * @property {boolean} c
 */
/**
 * @param {Partial<Small | Other>} x
 */
function takeMixedUnion(x) {
  return x;
}
takeMixedUnion({}); // ok
takeMixedUnion({ a: 1 }); // ok
// Expected: tsc accepts the mixed literal structurally, RTI exactObjects rejects the other member's excess prop (deliberate).
takeMixedUnion({ a: 1, c: true });
// @ts-expect-error: string is not assignable to number
takeMixedUnion({ a: 'x' });
/**
 * @param {Partial<Small | null>} x
 */
function takeNullable(x) {
  return x;
}
takeNullable(null); // ok
takeNullable({}); // ok
takeNullable({ a: 1 }); // ok
// @ts-expect-error: number has no properties in common with the nullable partial
takeNullable(5);
/**
 * @param {Partial<[number, string]>} x
 */
function takeTuple(x) {
  return x;
}
takeTuple([1, 's']); // ok
takeTuple([1, undefined]); // ok: members turn undefined-able
// @ts-expect-error: plain object is not a tuple
takeTuple({});
/**
 * @param {Required<[number, string]>} x
 */
function takeReqTuple(x) {
  return x;
}
takeReqTuple([1, 's']); // ok
// @ts-expect-error: string is not assignable to number
takeReqTuple(['s', 's']);
/**
 * @param {Partial<() => void>} x
 */
function takeFn(x) {
  return x;
}
takeFn(() => {}); // ok: functions are homomorphic identities
/**
 * @typedef {number} Id
 */
/**
 * @param {Partial<Id>} x
 */
function takeAliasPrim(x) {
  return x;
}
takeAliasPrim(5); // ok: typedef aliases resolve before passthrough
// @ts-expect-error: string is not assignable to number
takeAliasPrim('x');
/**
 * @param {Partial<NonNullable<Small | null>>} x
 */
function takeWrapNonNull(x) {
  return x;
}
takeWrapNonNull({}); // ok
takeWrapNonNull({ a: 1 }); // ok
// @ts-expect-error: string is not assignable to number
takeWrapNonNull({ a: 'x' });
/**
 * @param {Partial<Readonly<Small>>} x
 */
function takeWrapReadonly(x) {
  return x;
}
takeWrapReadonly({}); // ok
takeWrapReadonly({ b: 's' }); // ok
// @ts-expect-error: number is not assignable to string
takeWrapReadonly({ b: 1 });
/**
 * @template T
 * @typedef {Partial<T>} GenericPartial
 */
/**
 * @param {GenericPartial<Small>} x
 */
function takeGenericAlias(x) {
  return x;
}
takeGenericAlias({}); // ok
takeGenericAlias({ a: 1 }); // ok
// @ts-expect-error: string is not assignable to number
takeGenericAlias({ a: 'x' });
