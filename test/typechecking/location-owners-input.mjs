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
    return storage + value;
  },
  /**
   * Gets the value of specified bits from a number.
   * @param {number} storage - Number to extract the bits from.
   * @returns {number} Returns the extracted value.
   */
  get(storage) {
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
    return storage + value;
  }
  /**
   * Gets the value of specified bits from a number.
   * @param {number} storage - Number to extract the bits from.
   * @returns {number} Returns the extracted value.
   */
  get(storage) {
    return storage;
  }
}
BitPacking.set(1, 2); // ok: numbers pass
// @ts-expect-error: storage is not a number
BitPacking.set('nope', 2);
BitPacking.get(1); // ok: numbers pass
// @ts-expect-error: storage is not a number
BitPacking.get('nope');
BitPacker.set(1, 2); // ok: numbers pass
// @ts-expect-error: storage is not a number
BitPacker.set('nope', 2);
new BitPacker().get(1); // ok: numbers pass
// @ts-expect-error: storage is not a number
new BitPacker().get('nope');
