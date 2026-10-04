import {substituteType} from "./substituteType.js";
import {deepFreeze} from "./deepFreeze.js";
/**
 * Substituted expect trees by call site plus template bindings. The expect
 * tree is static per site (inline literal from the transpiler); bindings
 * vary per call — pre-pinned literals and constraints alike land in the
 * key, so repeats hit instead of cloning and re-walking the tree, while
 * different bindings never share. Cleared with the session (fixture
 * resets), since same-spelled sites in different files may carry different
 * shapes. Trees are deep-frozen: validation is read-only over expects, so
 * a future mutator fails loudly instead of corrupting shared cache entries.
 * @type {Map<string, *>}
 */
const substitutedCache = new Map();
/**
 * Substitutes template bindings into a pristine expect tree, memoized by
 * call site plus bindings. Pure substitution shares unchanged subtrees
 * with the pristine tree instead of cloning it first.
 * @param {*} expect - Pristine expect tree (never mutated).
 * @param {string} loc - String like `BoundingBox#compute`.
 * @param {string} name - Name of the argument.
 * @param {Record<string, *>} templates - Per-call template bindings.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {*} Substituted (frozen, shared) tree.
 * @example
 * substitutedFor({type: 'object', properties: {a: 'K'}}, 'C#m', 'arg', {K: '"a"'}, console.warn);
 * // frozen {type: 'object', properties: {a: '"a"'}}
 */
function substitutedFor(expect, loc, name, templates, warn) {
  const dictKey = Object.keys(templates).sort().map((key) => `${key}:${JSON.stringify(templates[key])}`).join(',');
  const key = `${loc}\n${name}\n${dictKey}`;
  let sub = substitutedCache.get(key);
  if (sub === undefined) {
    // Pure substitution never mutates its input, so no pre-clone: the
    // result shares every unchanged subtree with the pristine tree.
    sub = expect;
    for (const k in templates) {
      sub = substituteType(sub, k, templates[k], warn);
    }
    substitutedCache.set(key, deepFreeze(sub));
  }
  return sub;
}
export {substitutedFor, substitutedCache};
