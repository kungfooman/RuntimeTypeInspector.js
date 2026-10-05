
/**
 * Homomorphic `Partial`/`Required` over records: records stay records. `Partial<Record<string, number>>` is `Record<string, number | undefined>` while `Required` keeps values exactly (it never strips `undefined`). Every throwing call carries `@ts-expect-error`, so a tsc-strict run is green if and only if each directive is consumed and nothing else errors; `*-errors.json` pins the same sequence for RTI.
 */

/**
 * @param {Partial<Record<string, number>>} x
 */
function takePartialRecord(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Partial",
    "args": [
      {
        "type": "record",
        "key": "string",
        "val": "number"
      }
    ],
    "optional": false
  }, 'takePartialRecord', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takePartialRecord({}); // ok

takePartialRecord({
  k: 1
}); // ok

// @ts-expect-error: string is not assignable to number

 // ok

// @ts-expect-error: string is not assignable to number
takePartialRecord({
  k: 'x'
});

/**
 * @param {Required<Record<string, number>>} x
 */

function takeReqRecord(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Required",
    "args": [
      {
        "type": "record",
        "key": "string",
        "val": "number"
      }
    ],
    "optional": false
  }, 'takeReqRecord', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takeReqRecord({}); // ok

takeReqRecord({
  k: 1
}); // ok

// @ts-expect-error: string is not assignable to number

 // ok

// @ts-expect-error: string is not assignable to number
takeReqRecord({
  k: 'x'
});

/**
 * @param {Partial<Record<'a' | 'b', number>>} x
 */

function takeLiteralKeys(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Partial",
    "args": [
      {
        "type": "record",
        "key": {
          "type": "union",
          "members": [
            "'a'",
            "'b'"
          ]
        },
        "val": "number"
      }
    ],
    "optional": false
  }, 'takeLiteralKeys', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takeLiteralKeys({}); // ok

takeLiteralKeys({
  a: 1
}); // ok

// @ts-expect-error: string is not assignable to number

 // ok

// @ts-expect-error: string is not assignable to number
takeLiteralKeys({
  a: 'x'
});
