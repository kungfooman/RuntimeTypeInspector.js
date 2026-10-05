/**
 * Homomorphic Partial over indexed access: `{[K in keyof GizmoTheme]?: Partial<GizmoTheme[K]>}` (the transform-gizmo `setTheme` shape) used to reject every valid partial theme because `Partial` only accepted plain object typedefs. `Partial<GizmoTheme[K]>` instantiates per key to `Partial<mapping>` (shapeBase), `Partial<number>` (guideOcclusion) and `Partial<Color>` (disabled class): TypeScript keeps primitives as primitives, distributes over unions and turns object/class shapes optional with arrays staying arrays. Every throwing call carries `@ts-expect-error`, so a tsc-strict run is green if and only if each directive is consumed and nothing else errors; `*-errors.json` pins the same sequence for RTI.
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
