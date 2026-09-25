import {inspectType} from "./inspectType.js";
import {options} from "./options.js";
import {replaceType} from "./replaceType.js";
import {recurse} from "./validators.js";
/**
 * Per-call constraints for templates that already narrowed: `templates[bare]`
 * is overwritten with the pinned literal/union, so the declared constraint
 * would be lost for later widening decisions without this side table. Keyed
 * by the per-call templates dict (fresh object per invocation, so entries die
 * with the call). Never enumerated, so substitution loops stay untouched.
 * @type {WeakMap<object, Record<string, *>>}
 */
const narrowConstraints = new WeakMap();
/**
 * Narrows a bare template parameter from the runtime value, e.g. `K` becomes
 * `"camera"` once `name` validated against its `ComponentName` constraint.
 * Only literals narrow: objects keep the declared constraint.
 * @param {*} value - The actual value that was validated.
 * @returns {string|number|boolean|undefined} Literal type or undefined.
 */
function literalOf(value) {
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
}
/**
 * Flattens a pinned template type to its member list: plain literals yield a
 * single member, widened unions yield theirs.
 * @param {*} type - Pinned literal or widened union.
 * @returns {*[]} Flat member list.
 */
function unionMembers(type) {
  if (type && typeof type === 'object' && type.type === 'union' && Array.isArray(type.members)) {
    return [...type.members];
  }
  return [type];
}
/**
 * Validates a bare template occurrence with single-pass joint inference.
 * First sighting pins the literal (remembering the constraint); a later
 * sighting with a different literal widens toward the union TypeScript would
 * infer, provided the new literal satisfies the declared constraint.
 * Genuinely incompatible values still report exactly as before.
 * @param {*} value - The actual value that we need to check.
 * @param {*} expect - Substituted expected type for this occurrence.
 * @param {string} loc - String like `BoundingBox#compute`.
 * @param {string} name - Name of the argument.
 * @param {Record<string, *>} templates - Per-call template bindings.
 * @param {string} bare - Bare template key of this occurrence.
 * @returns {boolean} Returns wether `value` is in the shape of `expect`.
 */
function inspectBare(value, expect, loc, name, templates, bare) {
  if (!options.enabled) {
    return true;
  }
  /** @type {console["warn"]} */
  const noop = () => undefined;
  const silent = recurse(value, expect, loc, name, true, noop, 0);
  const literal = literalOf(value);
  const saved = narrowConstraints.get(templates);
  const narrowedBefore = saved !== undefined && Object.prototype.hasOwnProperty.call(saved, bare);
  if (silent) {
    if (literal !== undefined && !narrowedBefore) {
      const constraints = saved ?? {};
      constraints[bare] = templates[bare];
      narrowConstraints.set(templates, constraints);
      templates[bare] = literal;
    }
    return true;
  }
  if (literal === undefined || !narrowedBefore) {
    // Non-literals contribute no candidates, and the first sighting must
    // satisfy the constraint itself: report exactly as before.
    return inspectType(value, expect, loc, name);
  }
  if (!recurse(value, saved[bare], loc, name, true, noop, 0)) {
    // New literal violates the declared constraint too: genuinely
    // incompatible, TypeScript rejects the call as well.
    return inspectType(value, expect, loc, name);
  }
  const members = unionMembers(templates[bare]);
  const key = JSON.stringify(literal);
  if (!members.some((member) => JSON.stringify(member) === key)) {
    members.push(literal);
  }
  templates[bare] = members.length === 1 ? members[0] : {type: 'union', members};
  return true;
}
function inspectTypeWithTemplates(value, expect, loc, name, templates) {
  // console.log("old expect", expect);
  // Bare template params participate in inference. Besides plain `"K"`, this
  // includes annotated-atom wrappers like `{type: 'K', optional: true}` (what
  // annotateOptional emits for `@param {K} [a]`); anything structural (arrays,
  // unions, mappings, ...) only validates against the current binding.
  let bare;
  if (typeof expect === 'string') {
    bare = expect;
  } else if (expect && typeof expect === 'object' && typeof expect.type === 'string' &&
    Object.keys(expect).every((key) => key === 'type' || key === 'optional' || key === 'readonly')) {
    bare = expect.type;
  }
  // console.log("new expect", expect);
  let sub = expect;
  for (const key in templates) {
    sub = replaceType(sub, key, templates[key], console.warn);
  }
  if (bare === undefined || templates[bare] === undefined) {
    return inspectType(value, sub, loc, name);
  }
  return inspectBare(value, sub, loc, name, templates, bare);
}
export {inspectTypeWithTemplates};
