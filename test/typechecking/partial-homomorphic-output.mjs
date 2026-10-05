registerTypedef('Small', {
  "type": "object",
  "properties": {
    "a": "number",
    "b": "string"
  }
});
registerTypedef('GizmoTheme', {
  "type": "object",
  "properties": {
    "shapeBase": {
      "type": "mapping",
      "iterable": {
        "type": "union",
        "members": [
          "'x'",
          "'y'",
          "'z'",
          "'f'",
          "'xyz'"
        ]
      },
      "element": "K",
      "result": "Color",
      "optional": false
    },
    "guideBase": {
      "type": "mapping",
      "iterable": {
        "type": "union",
        "members": [
          "'x'",
          "'y'",
          "'z'"
        ]
      },
      "element": "K",
      "result": "Color",
      "optional": false
    },
    "guideOcclusion": "number",
    "disabled": "Color"
  }
});

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
registerClass(Color);
registerTypedef('Color', {
  "type": "object",
  "properties": {
    "r": "number",
    "g": "number",
    "b": "number",
    "a": "number"
  }
});

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
  if (!inspectType(partial, {
    "type": "mapping",
    "iterable": {
      "type": "keyof",
      "argument": "GizmoTheme"
    },
    "element": "K",
    "result": {
      "type": "reference",
      "name": "Partial",
      "args": [
        {
          "type": "indexedAccess",
          "index": "K",
          "object": "GizmoTheme"
        }
      ]
    },
    "question": "?",
    "optional": false
  }, 'setTheme', 'partial')) {
    youCanAddABreakpointHere();
  }
  return partial;
}
setTheme({}); // ok: outer mapping is optional

setTheme({
  guideOcclusion: 0.5
}); // ok: Partial<number> is number

setTheme({
  shapeBase: {
    x: new Color()
  }
}); // ok: deep partial of mapping

setTheme({
  shapeBase: {
    x: new Color()
  },
  guideOcclusion: 1
}); // ok: mixed

setTheme({
  guideBase: {
    x: new Color()
  }
}); // ok

setTheme({
  disabled: new Color()
}); // ok: full class instance fits Partial<class>

setTheme({
  disabled: {}
}); // ok: Partial<class> allows empty

// @ts-expect-error: string is not assignable to number

 // ok: Partial<class> allows empty

// @ts-expect-error: string is not assignable to number
setTheme({
  guideOcclusion: 'bad'
});
// @ts-expect-error: number is not a Color

setTheme({
  shapeBase: {
    x: 123
  }
});
// @ts-expect-error: unknown props are rejected

setTheme({
  unknownProp: 1
});

/**
 * @param {Partial<number>} x
 */

function takeNumber(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Partial",
    "args": [
      "number"
    ],
    "optional": false
  }, 'takeNumber', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takeNumber(1); // ok

// @ts-expect-error: empty object is not a number

 // ok

// @ts-expect-error: empty object is not a number
takeNumber({});

/**
 * @param {Partial<Small | number>} x
 */

function takeUnion(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Partial",
    "args": [
      {
        "type": "union",
        "members": [
          "Small",
          "number"
        ]
      }
    ],
    "optional": false
  }, 'takeUnion', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takeUnion(1); // ok: primitive member survives

takeUnion({
  a: 1
}); // ok: partial object member

takeUnion({}); // ok

// @ts-expect-error: string is not assignable to number

 // ok

// @ts-expect-error: string is not assignable to number
takeUnion({
  a: 'x'
});
// @ts-expect-error: boolean matches neither member

takeUnion(true);

/**
 * @param {Required<Partial<Small>>} x
 */

function takeRequired(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Required",
    "args": [
      {
        "type": "reference",
        "name": "Partial",
        "args": [
          "Small"
        ]
      }
    ],
    "optional": false
  }, 'takeRequired', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takeRequired({
  a: 1,
  b: 's'
}); // ok

// @ts-expect-error: Required re-imposes missing props

 // ok

// @ts-expect-error: Required re-imposes missing props
takeRequired({});

/**
 * @param {Partial<string[]>} x
 */

function takeArray(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Partial",
    "args": [
      {
        "type": "array",
        "elementType": "string"
      }
    ],
    "optional": false
  }, 'takeArray', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takeArray(['a']); // ok

takeArray(['a', undefined]); // ok: elements turn optional

// @ts-expect-error: plain object is not an array

 // ok: elements turn optional

// @ts-expect-error: plain object is not an array
takeArray({});

/**
 * @param {Partial<Color>} x
 */

function takeClass(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Partial",
    "args": [
      "Color"
    ],
    "optional": false
  }, 'takeClass', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takeClass(new Color()); // ok

takeClass({}); // ok

takeClass({
  r: 1
}); // ok: subset of class shape

// @ts-expect-error: string is not assignable to number

 // ok: subset of class shape

// @ts-expect-error: string is not assignable to number
takeClass({
  r: 'bad'
});
