import {unionMembers} from "./unionMembers.js";
import {widenLiteral} from "./widenLiteral.js";
import {extendsCheck} from "./evaluateCondition.js";
import {recurse} from "./validators.js";
/**
 * Merges one candidate into the call's bindings. The first candidate pins the
 * literal; a later distinct literal widens the pin to the first pin's base
 * type when that base still satisfies the declared constraint (e.g. `any`,
 * `string`), or unions the literals when the constraint itself holds literals
 * (e.g. `"a"|"b"`). Anything undecidable keeps the pin: precision over
 * guesswork. Failing values never pin (a value must validate before it may
 * contribute); their union appends are probed against the constraint first,
 * while widen decisions stand like tsc's fixing even when reporting.
 * @param {Record<string, *>} templates - Per-call template bindings.
 * @param {{pinned: Set<string>, constraints: Record<string, *}} state - Per-call inference state.
 * @param {string} key - Template key.
 * @param {string|number|boolean} literal - Fresh literal candidate.
 * @param {*} value - Candidate value (for probe validations).
 * @param {string} loc - String like `BoundingBox#compute`.
 * @param {string} name - Name of the argument.
 * @param {boolean} probing - False on passing values (bookkeeping only).
 * @param {console["warn"]} warn - Function to warn with.
 * @example
 * const templates = {K: 'string'};
 * const state = {pinned: new Set(), constraints: {}};
 * mergeCandidate(templates, state, 'K', '"a"', 'a', 'C#m', 'arg', false, console.warn);
 * // templates.K === '"a"' (pinned)
 * mergeCandidate(templates, state, 'K', '"b"', 'b', 'C#m', 'arg', false, console.warn);
 * // templates.K === 'string' (widened: the base still satisfies the constraint)
 */
function mergeCandidate(templates, state, key, literal, value, loc, name, probing, warn) {
  if (!Object.prototype.hasOwnProperty.call(templates, key)) {
    return;
  }
  if (!state.pinned.has(key)) {
    if (!probing) {
      state.pinned.add(key);
      // Aliased, not cloned: pure substitution never mutates dict values,
      // and validation only reads them, so the snapshot cannot corrupt.
      state.constraints[key] = templates[key];
      templates[key] = literal;
    }
    return;
  }
  const members = unionMembers(templates[key]);
  // Members are always literals (primitives): identity compares, with
  // `Object.is` so NaN candidates dedupe instead of accumulating forever.
  if (members.some((member) => Object.is(member, literal))) {
    return;
  }
  const constraint = state.constraints[key];
  const widened = widenLiteral(members[0]);
  const baseExtends = extendsCheck(widened, constraint, warn);
  if (baseExtends === true) {
    // Widened base still satisfies the constraint (`any`, `string`, ...):
    // e.g. `g('x', 1)` warns on `1` with the pin fixed to `string`, and
    // `f('a', {sub: 'b'})` passes, both matching tsc.
    templates[key] = widened;
    return;
  }
  if (baseExtends === false) {
    // Constraint itself holds literals (`"a"|"b"`): union them, but only for
    // values the constraint accepts, e.g. `hD('a', 'b')` passes like tsc.
    if (!probing || recurse(value, constraint, loc, name, true, warn, 0)) {
      members.push(literal);
      templates[key] = members.length === 1 ? members[0] : {type: 'union', members};
    }
  }
  // Undecidable: keep the pin (fail-closed precision).
}
export {mergeCandidate};
