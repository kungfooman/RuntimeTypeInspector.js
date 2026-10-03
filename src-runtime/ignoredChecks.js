/**
 * Exact `loc` or `loc.name` keys skipped by `inspectType` before any
 * validation or preview work runs (e.g.
 * `'BoundingBox#compute.vertices'` for a proven over-allocated tail).
 * The source-local sibling is `@ignoreRTI` (whole function) and
 * `@ignoreRTI names` (listed params); this registry is the runtime side
 * for hosts that cannot annotate (lint forbids custom tags, generated
 * code) — fill it from the host entry file next to `customTypes` and
 * `customValidations`. Bare `loc` entries silence the whole function.
 * @type {Set<string>}
 */
const ignoredChecks = new Set();
export {ignoredChecks};
