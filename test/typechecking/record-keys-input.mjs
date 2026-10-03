/**
 * `Record<number, ...>` accepts canonical numeric keys: at runtime every
 * object key is a string, so tsc's `0` arrives as `'0'`. Non-numeric keys
 * and wrong values still fail. Every throwing call carries
 * `@ts-expect-error`, so a tsc-strict run is green if and only if each
 * directive is consumed and nothing else errors; `*-errors.json` pins the
 * same sequence for RTI.
 */
/**
 * @param {Record<number, string>} byIndex - Number-indexed entries.
 */
function takeIndexed(byIndex) {
  return byIndex;
}
takeIndexed({0: 'a'}); // ok
// @ts-expect-error: named key for a numeric index signature
takeIndexed({a: 'x'});
// @ts-expect-error: number value for a string-valued record
takeIndexed({0: 1});
/**
 * @param {Record<string, number>} byName - String-indexed entries.
 */
function takeNamed(byName) {
  return byName;
}
takeNamed({a: 1}); // ok
// @ts-expect-error: string value for a number-valued record
takeNamed({a: 'x'});
/**
 * @typedef {"admin" | "user" | "guest"} Role
 */
/**
 * @param {Record<Role, boolean>} permissions - Per-role flags.
 */
function takeRoles(permissions) {
  return permissions;
}
takeRoles({admin: true, user: true, guest: false}); // ok
// @ts-expect-error: unknown role flag
takeRoles({admin: true, root: false});
