
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
   */   constructor(key) {
    const rtiTemplates = {
      "T": {
        "type": "keyof",
        "argument": "Date"
      }
    };
    if (!inspectTypeWithTemplates(key, "T", 'KeyBox#constructor', 'key', rtiTemplates)) {
      youCanAddABreakpointHere();
    }
    this._key = key;
  }
}
registerClass(KeyBox);
const okKey = new KeyBox('getTime'); // ok

// @ts-expect-error: no such key

 // ok

// @ts-expect-error: no such key
const badKey = new KeyBox('nope');

/**
 * @param {keyof Date} key - A Date key.
 * @returns {string} The key, stringified.
 */

function takeKey(key) {
  if (!inspectType(key, {
    "type": "keyof",
    "argument": "Date",
    "optional": false
  }, 'takeKey', 'key')) {
    youCanAddABreakpointHere();
  }
  return String(key);
}
const okDirect = takeKey('getTime'); // ok

// @ts-expect-error: no such key

 // ok

// @ts-expect-error: no such key
const badDirect = takeKey('nope');
