
/**
 * Dep-free parser gap closures: every throwing call carries
 * `@ts-expect-error`, so a tsc-strict run is green if and only if each
 * directive is consumed and nothing else errors; `*-errors.json` pins the
 * same sequence for RTI.
 */

/**
 * @param {(a: number) => string} f
 */
function takeFn(f) {
  if (!inspectType(f, {
    "type": "function",
    "parameters": [
      {
        "type": "parameter",
        "paramType": "number",
        "name": "a"
      }
    ],
    "optional": false
  }, 'takeFn', 'f')) {
    youCanAddABreakpointHere();
  }
  return f;
}

/**
 * @param {number} a
 * @returns {string}
 */

function numToString(a) {
  if (!inspectType(a, "number", 'numToString', 'a')) {
    youCanAddABreakpointHere();
  }
  return String(a);
}
takeFn(numToString); // ok

// @ts-expect-error: number is not assignable to string

 // ok

// @ts-expect-error: number is not assignable to string
takeFn(1);

/**
 * @param {new (a: number) => any} C
 */

function takeNew(C) {
  if (!inspectType(C, {
    "type": "new",
    "parameters": [
      {
        "type": "parameter",
        "paramType": "number",
        "name": "a"
      }
    ],
    "ret": "any",
    "optional": false
  }, 'takeNew', 'C')) {
    youCanAddABreakpointHere();
  }
  return C;
}
takeNew(class Box {

/**
 * @param {number} a
 */ constructor(a) {
  if (!inspectType(a, "number", 'Box#constructor', 'a')) {
    youCanAddABreakpointHere();
  }
  this.a = a;
}
}); // ok

// @ts-expect-error: number is not a constructor

 // ok

// @ts-expect-error: number is not a constructor
takeNew(1);

/**
 * @param {{a?: string, readonly b: number}} o
 */

function takeFlags(o) {
  if (!inspectType(o, {
    "type": "object",
    "properties": {
      "a": {
        "type": "atom",
        "atomType": "string",
        "optional": true
      },
      "b": {
        "type": "atom",
        "atomType": "number",
        "readonly": true
      }
    },
    "optional": false
  }, 'takeFlags', 'o')) {
    youCanAddABreakpointHere();
  }
  return o;
}
takeFlags({
  b: 1
}); // ok: a is optional

takeFlags({
  a: 'x',
  b: 1
}); // ok

// @ts-expect-error: b is missing

 // ok

// @ts-expect-error: b is missing
takeFlags({
  a: 'x'
});

/**
 * @param {{[n: number]: string}} m
 */

function takeIndex(m) {
  if (!inspectType(m, {
    "type": "object",
    "indexSignatures": [
      {
        "type": "indexSignature",
        "indexType": "string",
        "indexParameters": [
          {
            "type": "parameter",
            "paramType": "number",
            "name": "n"
          }
        ]
      }
    ],
    "optional": false
  }, 'takeIndex', 'm')) {
    youCanAddABreakpointHere();
  }
  return m;
}
takeIndex({
  0: 'a'
}); // ok

// @ts-expect-error: non-numeric key with a number index

 // ok

// @ts-expect-error: non-numeric key with a number index
takeIndex({
  a: 'x'
});

/**
 * @param {123n} b
 */

function takeBigint(b) {
  if (!inspectType(b, {
    "type": "bigint",
    "literal": "123",
    "optional": false
  }, 'takeBigint', 'b')) {
    youCanAddABreakpointHere();
  }
  return b;
}
takeBigint(123n); // ok

// @ts-expect-error: number is not a bigint literal

 // ok

// @ts-expect-error: number is not a bigint literal
takeBigint(123);

/**
 * @param {`id`} t
 */

function takeTemplate(t) {
  if (!inspectType(t, {
    "type": "templateLiteral",
    "quasis": [
      "id"
    ],
    "types": [],
    "optional": false
  }, 'takeTemplate', 't')) {
    youCanAddABreakpointHere();
  }
  return t;
}
takeTemplate('id'); // ok

// @ts-expect-error: wrong literal

 // ok

// @ts-expect-error: wrong literal
takeTemplate('xx');

/**
 * @param {[first: string, ...rest: number[]]} t
 */

function takeNamedTuple(t) {
  if (!inspectType(t, {
    "type": "tuple",
    "elements": [
      {
        "type": "tupleMember",
        "name": "first",
        "elementType": "string"
      },
      {
        "type": "tupleMember",
        "name": "rest",
        "elementType": {
          "type": "array",
          "elementType": "number"
        },
        "dotDot": true
      }
    ],
    "optional": false
  }, 'takeNamedTuple', 't')) {
    youCanAddABreakpointHere();
  }
  return t;
}
takeNamedTuple(['a', 1, 2]); // ok

takeNamedTuple(['a']); // ok: rest may be empty

// @ts-expect-error: string is not assignable to number

 // ok: rest may be empty

// @ts-expect-error: string is not assignable to number
takeNamedTuple(['a', 'b']);
