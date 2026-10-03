/**
 * `Map` keys validate like values: `Map<number, ...>` (gsplat caches) and
 * class-keyed maps used to fail closed with `validateMap> unhandled key`.
 * Every throwing call carries `@ts-expect-error`, so a tsc-strict run is
 * green if and only if each directive is consumed and nothing else
 * errors; `*-errors.json` pins the same sequence for RTI.
 */
class Texture {
  constructor() {
    /** @type {string} */
    this.label = 'x';
  }
}
/**
 * @param {Map<number, string>} byId - Number-keyed entries.
 */
function takeById(byId) {
  return byId;
}
takeById(new Map([[1, 'a']])); // ok
// @ts-expect-error: string key for a number-keyed map
takeById(new Map([['1', 'a']]));
/**
 * @param {Map<Texture, number>} usage - Class-keyed entries.
 */
function takeUsage(usage) {
  return usage;
}
takeUsage(new Map([[new Texture(), 1]])); // ok
// @ts-expect-error: plain object is no Texture
takeUsage(new Map([[{}, 1]]));
/**
 * @param {Map<string, number>} scores - String keys keep working.
 */
function takeScores(scores) {
  return scores;
}
takeScores(new Map([['a', 1]])); // ok
// @ts-expect-error: string value for a number-valued map
takeScores(new Map([['a', 'x']]));
