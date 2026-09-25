
/**
 * `{}` accepts every non-nullish value (like TS: `1 extends {}`),
 * while `object` still rejects primitives.
 */

/**
 * @param {{}} x - Any non-nullish value.
 */
function takeAnyNonNull(x) {
  if (!inspectType(x, {
    "type": "object",
    "optional": false
  }, 'takeAnyNonNull', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takeAnyNonNull('custom'); // ok: strings extend {}

takeAnyNonNull(1); // ok: numbers extend {}

takeAnyNonNull({
  a: 1
}); // ok

takeAnyNonNull(null); // warns: null is not non-nullish

takeAnyNonNull(undefined); // warns: undefined is not non-nullish


/**
 * @param {object} x - A non-primitive object.
 */

function takeObject(x) {
  if (!inspectType(x, {
    "type": "object",
    "properties": {},
    "optional": false
  }, 'takeObject', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takeObject({
  a: 1
}); // ok

takeObject(1); // warns: primitives are not objects

takeObject('custom'); // warns: primitives are not objects

takeObject(null); // warns: null is not an object


/**
 * @param {string & {}} x - A string (the engine's extensible-name pattern).
 */

function takeStringNonNull(x) {
  if (!inspectType(x, {
    "type": "intersection",
    "members": [
      "string",
      {
        "type": "object"
      }
    ],
    "optional": false
  }, 'takeStringNonNull', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takeStringNonNull('custom'); // ok

takeStringNonNull(1); // warns: 1 is not a string

takeStringNonNull(null); // warns: null is not a string

