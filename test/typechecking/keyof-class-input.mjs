/**
 * `keyof` over classes: registered classes resolve through the harvested
 * chain, platform constructors reflect off the prototype. Both direct and
 * template-constrained uses validate. Valid TypeScript throughout
 * (tsc-checked alongside).
 */
/**
 * @template {keyof Date} T
 */
class KeyBox {
    /**
     * @param {T} key - A Date key.
     */
    constructor(key) {
        this._key = key;
    }
}
const okKey = new KeyBox('getTime'); // ok
// @ts-expect-error: no such key
const badKey = new KeyBox('nope');
/**
 * @param {keyof Date} key - A Date key.
 * @returns {string} The key, stringified.
 */
function takeKey(key) {
    return String(key);
}
const okDirect = takeKey('getTime'); // ok
// @ts-expect-error: no such key
const badDirect = takeKey('nope');
