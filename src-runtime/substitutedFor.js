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
    // Single-binding dicts take one pass like before; several bindings may
    // nest (a `T` constraint mentioning `K`), so repeat until stable — each
    // round shares identity on no-change, and the round cap bounds
    // pathological binding cycles. Either way the outcome no longer depends
    // on binding order.
    sub = expect;
    const keys = Object.keys(templates);
    if (keys.length <= 1) {
      for (const k in templates) {
        sub = substituteType(sub, k, templates[k], warn);
      }
    } else {
      let changed = true;
      for (let round = 0; changed && round <= keys.length; round++) {
        changed = false;
        for (const k of keys) {
          const next = substituteType(sub, k, templates[k], warn);
          if (next !== sub) {
            sub = next;
            changed = true;
          }
        }
      }
    }
    substitutedCache.set(key, deepFreeze(sub));
  }
  return sub;
}
export {substitutedFor, substitutedCache};
