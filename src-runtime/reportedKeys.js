/**
 * Keys (`${loc}-${name}`) already reported to the panel in full, each mapped
 * to the last reported failure's shape tag (see `tagValue`). A check that
 * fails every frame in a hot loop would otherwise rebuild previews,
 * structured-clone the value twice (clonability probe plus post) and repost
 * it all for a row the panel already holds; same-shape repeats only send
 * the key so the panel can bump hits and the error count, while a mode
 * change (string then object for one argument) reports in full again.
 * Cleared with the panel session (or by hosts on HMR) so the next failure
 * reports in full again.
 *
 * Spec convention: the map is process-global, so every spec that posts a
 * failing check must use a unique `loc`/`name` pair — reusing one across
 * tests turns every later post into a key-only repeat.
 * @example
 * reportedKeys.set('takeFloat.data', 'array');
 * reportedKeys.clear(); // fresh session: next failure reports in full
 */
const reportedKeys = new Map();
export {reportedKeys};
