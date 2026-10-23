
/**
 * Locational information: object-literal methods report their owner
 * (`BitPacking.set`, not `set`) and static class members use a dot
 * (`BitPacker.set`, not `BitPacker#set`), mirroring how the members
 * are accessed. Instance members keep the hash. Every throwing call
 * carries `@ts-expect-error`, so a tsc-strict run is green if and only
 * if each directive is consumed and nothing else errors;
 * `*-errors.json` pins the same sequence for RTI.
 */
const BitPacking = {
  
  /**
   * Sets a value to specified bits of a number.
   * @param {number} storage - Number to store the bits into.
   * @param {number} value - Value to store.
   * @returns {number} Returns the storage updated with the value.
   */
  set(storage, value) {
    if (!inspectType(storage, "number", 'BitPacking.set', 'storage')) {
      youCanAddABreakpointHere();
    }
    if (!inspectType(value, "number", 'BitPacking.set', 'value')) {
      youCanAddABreakpointHere();
    }
    return storage + value;
  },
  
  /**
   * Gets the value of specified bits from a number.
   * @param {number} storage - Number to extract the bits from.
   * @returns {number} Returns the extracted value.
   */
  get(storage) {
    if (!inspectType(storage, "number", 'BitPacking.get', 'storage')) {
      youCanAddABreakpointHere();
    }
    return storage;
  },
};
class BitPacker {
  
  /**
   * Sets a value to specified bits of a number.
   * @param {number} storage - Number to store the bits into.
   * @param {number} value - Value to store.
   * @returns {number} Returns the storage updated with the value.
   */
  static set(storage, value) {
    if (!inspectType(storage, "number", 'BitPacker.set', 'storage')) {
      youCanAddABreakpointHere();
    }
    if (!inspectType(value, "number", 'BitPacker.set', 'value')) {
      youCanAddABreakpointHere();
    }
    return storage + value;
  }
  
  /**
   * Gets the value of specified bits from a number.
   * @param {number} storage - Number to extract the bits from.
   * @returns {number} Returns the extracted value.
   */

  get(storage) {
    if (!inspectType(storage, "number", 'BitPacker#get', 'storage')) {
      youCanAddABreakpointHere();
    }
    return storage;
  }
}
registerClass(BitPacker);
registerTypedef('BitPacker', {
  "type": "object",
  "properties": {
    "get": "Function"
  }
});
BitPacking.set(1, 2); // ok: numbers pass

// @ts-expect-error: storage is not a number

 // ok: numbers pass

// @ts-expect-error: storage is not a number
BitPacking.set('nope', 2);
BitPacking.get(1); // ok: numbers pass

// @ts-expect-error: storage is not a number

 // ok: numbers pass

// @ts-expect-error: storage is not a number
BitPacking.get('nope');
BitPacker.set(1, 2); // ok: numbers pass

// @ts-expect-error: storage is not a number

 // ok: numbers pass

// @ts-expect-error: storage is not a number
BitPacker.set('nope', 2);
new BitPacker().get(1); // ok: numbers pass

// @ts-expect-error: storage is not a number

 // ok: numbers pass

// @ts-expect-error: storage is not a number
new BitPacker().get('nope');
