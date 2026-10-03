/**
 * Per-check custom validators keyed by exact `loc` or `loc.name` (e.g.
 * `'BoundingBox#compute.vertices'`). Unlike `customValidations` (veto
 * only) and `ignoredChecks` (skip entirely), an entry here fully
 * replaces the check: return `true` to pass, `false` to fail through the
 * standard error pipeline (snapshot, panel, breakpoint, counter). The
 * function receives the validator contract
 * `(value, expect, loc, name, critical, warn, depth)` and can reuse
 * `recurse` for element-wise logic. Top-level argument checks only —
 * union members recurse internally past this hook. Fill it from the host
 * entry file for checks that need domain control instead of silence,
 * e.g. holes-skipped but strings-still-flagged array tails.
 * @type {Map<string, Function>}
 */
const customChecks = new Map();
export {customChecks};
