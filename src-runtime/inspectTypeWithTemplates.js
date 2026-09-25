import {collectCandidates} from "./collectCandidates.js";
import {extendsCheck} from "./evaluateCondition.js";
import {inspectType} from "./inspectType.js";
import {options} from "./options.js";
import {replaceType} from "./replaceType.js";
import {recurse} from "./validators.js";
/**
 * Per-call inference state, keyed by the per-invocation templates dict (fresh
 * object per call, so entries die with it). `pinned` records keys this call
 * already fixed; `constraints` keeps the declared constraint of fixed keys
 * for later widen/union decisions, cloned at pin time so later in-place
 * substitutions cannot corrupt the snapshot.
 * @type {WeakMap<object, {pinned: Set<string>, constraints: Record<string, *>>}>}
 */
const inferenceState = new WeakMap();
/**
 * Widens a literal to its base type, mirroring TypeScript's literal widening
 * for freshly inferred candidates (`"a"` -> `string`, `1` -> `number`).
 * @param {string|number|boolean} literal - The pinned literal.
 * @returns {string} Widened base type.
 */
function widenLiteral(literal) {
  return typeof literal === 'string' ? 'string' : typeof literal === 'number' ? 'number' : 'boolean';
}
/**
 * Flattens a pinned template type to its member list: plain literals yield a
 * single member, widened unions yield theirs.
 * @param {*} type - Pinned literal or literal union.
 * @returns {*[]} Flat member list.
 */
function unionMembers(type) {
  if (type && typeof type === 'object' && type.type === 'union' && Array.isArray(type.members)) {
    return [...type.members];
  }
  return [type];
}
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
 */
function mergeCandidate(templates, state, key, literal, value, loc, name, probing, warn) {
  if (!Object.prototype.hasOwnProperty.call(templates, key)) {
    return;
  }
  if (!state.pinned.has(key)) {
    if (!probing) {
      state.pinned.add(key);
      state.constraints[key] = structuredClone(templates[key]);
      templates[key] = literal;
    }
    return;
  }
  const members = unionMembers(templates[key]);
  if (members.some((member) => JSON.stringify(member) === JSON.stringify(literal))) {
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
/**
 * Validates one templated occurrence with joint inference across the call.
 * The value is validated against the current bindings; candidates collected
 * from passing occurrences (bare and nested, never `NoInfer` or
 * unresolvable positions) pin or widen the bindings for later occurrences. A
 * value that fails against the current bindings is re-probed after merging
 * its own candidates, so concurrently inferred siblings widen the pin before
 * any error is reported. Genuinely incompatible values report exactly as
 * untemplated checks do.
 * @param {*} value - The actual value that we need to check.
 * @param {*} expect - Substituted expected type for this occurrence.
 * @param {*} rawExpect - Pristine unsubstituted expected type.
 * @param {string} loc - String like `BoundingBox#compute`.
 * @param {string} name - Name of the argument.
 * @param {Record<string, *>} templates - Per-call template bindings.
 * @returns {boolean} Returns wether `value` is in the shape of `expect`.
 */
function inspectInferred(value, expect, rawExpect, loc, name, templates) {
  if (!options.enabled) {
    return true;
  }
  /** @type {console["warn"]} */
  const noop = () => undefined;
  let state = inferenceState.get(templates);
  if (!state) {
    state = {pinned: new Set(), constraints: {}};
    inferenceState.set(templates, state);
  }
  if (recurse(value, expect, loc, name, true, noop, 0)) {
    for (const candidate of collectCandidates(value, rawExpect)) {
      mergeCandidate(templates, state, candidate.key, candidate.literal, candidate.value, loc, name, false, noop);
    }
    return true;
  }
  // Failed against current bindings: the value's own candidates may widen or
  // union a pin (joint inference) before reporting. Widen decisions persist
  // like tsc's fixing, even when this value still reports.
  for (const candidate of collectCandidates(value, rawExpect)) {
    mergeCandidate(templates, state, candidate.key, candidate.literal, candidate.value, loc, name, true, noop);
  }
  let sub = structuredClone(rawExpect);
  for (const key in templates) {
    sub = replaceType(sub, key, templates[key], noop);
  }
  if (recurse(value, sub, loc, name, true, noop, 0)) {
    return true;
  }
  // Report against the rebuilt bindings (post-widen), so the message names
  // the fixed type tsc would name (e.g. `string`, not the stale `"x"`).
  return inspectType(value, sub, loc, name);
}
function inspectTypeWithTemplates(value, expect, loc, name, templates) {
  // console.log("old expect", expect);
  // console.log("new expect", expect);
  // Substitute into a clone: the pristine tree is needed below for candidate
  // collection (template refs intact) and for rebuilding after widening.
  let sub = structuredClone(expect);
  for (const key in templates) {
    sub = replaceType(sub, key, templates[key], console.warn);
  }
  return inspectInferred(value, sub, expect, loc, name, templates);
}
export {inspectTypeWithTemplates};
