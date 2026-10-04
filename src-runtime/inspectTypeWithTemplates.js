import {collectCandidates} from "./collectCandidates.js";
import {inspectType} from "./inspectType.js";
import {mergeCandidate} from "./mergeCandidate.js";
import {options} from "./options.js";
import {substitutedFor} from "./substitutedFor.js";
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
  const sub = substitutedFor(rawExpect, loc, name, templates, noop);
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
  // Memoized by site plus bindings (see substitutedCache).
  return inspectInferred(value, substitutedFor(expect, loc, name, templates, console.warn), expect, loc, name, templates);
}
export {inspectTypeWithTemplates};
