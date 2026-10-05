/**
 * Nested template reference inside a constraint (`T` bounded by `Array<K>`):
 * bindings resolve no matter the `@template` source order. Deliberate
 * divergence from tsc: tsc pins `K` to `'a'` from the bare `first`
 * occurrence and rejects the widened call below, while RTI widens joint
 * candidates (same philosophy as the `NoInfer` fixtures) and accepts it.
 * Only the genuinely wrong call throws.
 */
/**
 * @template {string} K
 * @template {Array<K>} T
 */
class KeyedBox {
    /**
     * @param {T} keys - Keys of K.
     * @param {K} first - One key.
     */
    constructor(keys, first) {
        this._keys = keys;
        this._first = first;
    }
}
// @ts-expect-error: tsc pins K to 'a' and rejects 'b'; RTI widens and accepts
const okBox = new KeyedBox(['a', 'b'], 'a'); // ok under RTI widening
// @ts-expect-error: numbers are no strings
const badBox = new KeyedBox([1, 2], 'a');
