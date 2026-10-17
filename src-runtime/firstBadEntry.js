import {validators} from "./validators.js";
import {classes} from "./registerClass.js";
import {validateReference} from "./validateReference.js";
import {validateNumber} from "./validateNumber.js";
import {validateString} from "./validateString.js";
import {validateBoolean} from "./validateBoolean.js";
import {customTypes} from "./customTypes.js";
import {customValidations} from "./customValidations.js";
import {options} from "./options.js";
/**
 * Names sharing space between utility types and registered classes: the
 * reference validator resolves them through its utility `case` branches
 * before the registered-class branch can ever run, so `instanceof` alone
 * would report a verdict the validator does not agree with.
 * @type {Set<string>}
 */
const utilityNames = new Set([
  'Awaited',
  'ConstructorParameters',
  'Exclude',
  'Extract',
  'IfEquals',
  'InstanceType',
  'Iterable',
  'IterableIterator',
  'Lowercase',
  'NoInfer',
  'NonNullable',
  'Omit',
  'Parameters',
  'Partial',
  'Pick',
  'Readonly',
  'Required',
  'ReturnType',
  'Uncapitalize',
  'Uppercase',
]);
/**
 * Scans a `Map` for the first entry a specialized check would reject,
 * without building per-entry names or recursing. Keys mirror
 * `validateNumber` (`typeof`, `NaN`, `Infinity` unless
 * `options.checkInfinity` is `false`), `string` and `boolean` use
 * `typeof` checks like their validators, and registered-class values
 * use `value instanceof`, the same branch `validateReference` takes.
 * Any value the `instanceof` check misses is only flagged as a suspect:
 * the caller's full loop then revalidates from that entry onward, so
 * results and warnings stay identical. Utility names and everything
 * outside these shapes return `-2`: scan nothing, matching the zero
 * divergence contract `firstBadIndex` keeps for arrays. The fast path
 * only applies while the `validators` table still holds the originals
 * and no userland hooks are registered, because overrides fall back as
 * well and custom behavior keeps composing through the full loop.
 * @param {Map} value - The map to scan.
 * @param {*} key - The map node's `key` type (`undefined` means unchecked).
 * @param {*} val - The map node's `val` type (`undefined` means unchecked).
 * @returns {number} Iteration index of the first suspect entry, `-1` when the
 * whole map is clean, `-2` when the fast path does not apply.
 * @example
 * class Box {}
 * class Other {}
 * registerClass(Box); registerClass(Other);
 * firstBadEntry(new Map([[1, {x: 1}]]), 'number', 'Other'); // -2
 * firstBadEntry(new Map([[1, new Box()]]), 'number', 'Box'); // -1
 * firstBadEntry(new Map([[1, new Box()], [2, new Other()]]), 'number', 'Box'); // 1
 */
function firstBadEntry(value, key, val) {
  // Without a registered pipeline or with userland hooks the scan cannot
  // reproduce custom recursion verbatim, so out of the way it stays.
  if (validators.validateType === undefined ||
    validators.validateReference !== validateReference ||
    validators.validateNumber !== validateNumber ||
    validators.validateString !== validateString ||
    validators.validateBoolean !== validateBoolean ||
    customValidations.length > 0 ||
    customTypes.number || customTypes.string || customTypes.boolean) {
    return -2;
  }
  const checkInfinity = options.checkInfinity !== false;
  /** @type {null | ((x: any) => boolean)} */
  let keyBad;
  if (key !== undefined) {
    if (key === 'number') {
      // Mirrors `validateNumber` exactly, `Infinity` included.
      keyBad = checkInfinity ? detectsBadNumber :
        (k) => typeof k !== 'number' || Number.isNaN(k);
    } else if (key === 'string' || key === 'boolean') {
      const want = key;
      keyBad = (k) => typeof k !== want;
    } else if (classes[key]) {
      // Same `instanceof` branch as the reference validator; conservative
      // flags only steer the caller's full loop, never a verdict.
      const ctor = classes[key];
      keyBad = (k) => !(k instanceof ctor);
    } else {
      return -2;
    }
  }
  /** @type {null | ((x: any) => boolean)} */
  let valBad;
  if (val !== undefined) {
    if (val === 'number') {
      valBad = checkInfinity ? detectsBadNumber :
        (v) => typeof v !== 'number' || Number.isNaN(v);
    } else if (val === 'string' || val === 'boolean') {
      const want = val;
      valBad = (v) => typeof v !== want;
    } else if (classes[val]) {
      const ctor = classes[val];
      valBad = (v) => !(v instanceof ctor);
    } else if (typeof val === 'object' && val.type === 'reference' &&
      !utilityNames.has(val.name) && classes[val.name]) {
      const ctor = classes[val.name];
      valBad = (v) => !(v instanceof ctor);
    } else {
      return -2;
    }
  }
  if (keyBad === undefined && valBad === undefined) {
    return -2;
  }
  const kb = keyBad ?? null;
  const vb = valBad ?? null;
  // Both-sides-specialized combo is one in Closure branch per entry with
  // the key check first, exactly the full loop's key-then-value order.
  let index = 0;
  let bad = -1;
  value.forEach((v, k) => {
    if (bad !== -1) {
      return;
    }
    if ((kb !== null && kb(k)) || (vb !== null && vb(v))) {
      bad = index;
    }
    index++;
  });
  return bad;
}
function detectsBadNumber(x) {
  return typeof x !== 'number' || Number.isNaN(x) ||
    (options.checkInfinity !== false && !Number.isFinite(x));
}
export {firstBadEntry};
