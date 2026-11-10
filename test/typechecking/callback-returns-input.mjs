/**
 * Hostile `@callback` shapes: every throwing call carries
 * `@ts-expect-error`, so a tsc-strict run is green if and only if each
 * directive is consumed and nothing else errors; `*-errors.json` pins the
 * same sequence for RTI. The transpile fold registers every `@callback`
 * typedef as plain `Function` (see `parseJSDocTypedef`), so params and
 * returns never gate at runtime: any function passes, any non-function
 * warns, identically on both checkers. Reader-level shape (returns
 * binding, nested templates, dotted children, tilde recovery, inline
 * types) is pinned by unit specs, not by runtime behavior.
 */
/**
 * @callback HandleEvent
 * @param {any} [arg1] - First argument.
 * @returns {void}
 */
/**
 * @param {HandleEvent} cb - A handler.
 */
function takeHandler(cb) {
  return cb;
}
takeHandler(() => undefined); // ok: any function satisfies the Function typedef
// @ts-expect-error: 1 is not a Function
takeHandler(1);
/**
 * @callback HasReturn
 * @param {number} x - A number.
 * @returns {string}
 */
/**
 * @param {HasReturn} cb - A callback with a typed return.
 */
function takeReturning(cb) {
  return cb;
}
takeReturning((/** @type {number} */ x) => String(x)); // ok
// @ts-expect-error: number is not a function at all
takeReturning(42);
takeReturning(() => 'ok'); // ok in both: fewer params is assignable, Function check passes
/**
 * @callback WithOpts
 * @param {object} opts - Options.
 * @param {string} opts.name - A name.
 * @returns {void}
 */
/**
 * @param {WithOpts} cb - A callback with dotted children.
 */
function takeOpts(cb) {
  return cb;
}
takeOpts((opts) => undefined); // ok
// @ts-expect-error: null is not a Function
takeOpts(null);
/**
 * @callback Empty
 * @returns {void}
 */
/**
 * @param {Empty} cb - A callback with no params.
 */
function takeEmpty(cb) {
  return cb;
}
takeEmpty(() => undefined); // ok
// @ts-expect-error: undefined is not a Function
takeEmpty(undefined);
