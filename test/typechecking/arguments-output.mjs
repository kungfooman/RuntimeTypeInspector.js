
/**
 * `IArguments` accepts the `arguments` object (or anything iterable) and
 * rejects the rest without throwing: nullish values used to crash the
 * validator on the `Symbol.iterator` read. Every throwing call carries
 * `@ts-expect-error`, so a tsc-strict run is green if and only if each
 * directive is consumed and nothing else errors; `*-errors.json` pins the
 * same sequence for RTI.
 */

/**
 * @param {IArguments} args - The arguments.
 */
function takeArgs(args) {
  if (!inspectType(args, "IArguments", 'takeArgs', 'args')) {
    youCanAddABreakpointHere();
  }
  return args;
}

/**
 * @param {...any} rest - The rest.
 */

function forward(...rest) {
  if (!inspectType(rest, {
    "type": "array",
    "elementType": "any",
    "optional": false
  }, 'forward', 'rest')) {
    youCanAddABreakpointHere();
  }
  takeArgs(arguments); // ok: a real `arguments` object

}
forward(1, 2, 3);
// @ts-expect-error: null is no `arguments` object

takeArgs(null);
// @ts-expect-error: plain objects do not iterate

takeArgs({});
