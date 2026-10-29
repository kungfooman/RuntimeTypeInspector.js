import {validators} from "./validators.js";
import {classes} from "./registerClass.js";
import {validateReference} from "./validateReference.js";
import {validateNumber} from "./validateNumber.js";
import {validateString} from "./validateString.js";
import {validateBoolean} from "./validateBoolean.js";
import {customTypes} from "./customTypes.js";
import {customValidations} from "./customValidations.js";
import {options} from "./options.js";
import {isFailingNumberDisallowingInf} from "./isFailingNumberDisallowingInf.js";
import {isFailingNumberAllowingInf} from "./isFailingNumberAllowingInf.js";
/**
 * Names sharing space between utility types and registered classes: the
 * reference validator resolves them through its utility `case` branches
 * before the registered-class branch can ever run, so `instanceof` alone
 * would report a verdict the validator does not agree with. Keep this set
 * in sync with the utility `case` branches of `validateReference`
 * (`ArrayLike` family, `Readonly*`, `ConcatArray`, `Partial` family,
 * `Awaited`, `ReturnType`, `NoInfer`, intrinsics, iterables): a missing
 * name lets the scan trust `instanceof` for a class that shadows it, and
 * the windowed map path returns clean without ever running the loop.
 * @type {Set<string>}
 */
const utilityNames = new Set([
  'ArrayLike',
  'AsyncIterable',
  'AsyncIterableIterator',
  'Awaited',
  'ConcatArray',
  'ConstructorParameters',
  'Exclude',
  'Extract',
  'HTMLCollection',
  'HTMLCollectionOf',
  'IfEquals',
  'InstanceType',
  'Iterable',
  'IterableIterator',
  'Lowercase',
  'NoInfer',
  'NodeList',
  'NodeListOf',
  'NonNullable',
  'Omit',
  'Parameters',
  'Partial',
  'Pick',
  'Readonly',
  'ReadonlyArray',
  'ReadonlyMap',
  'ReadonlySet',
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
  // Fail closed when the option is missing: a deleted or undefined flag
  // must not silently widen validation to accept infinities.
  const checkInfinity = options.checkInfinity === true;
  // The Infinity verdict is a pre-picked predicate instead of a boolean
  // threaded through every call: both scanner paths share this pick.
  const numberBad = checkInfinity ? isFailingNumberDisallowingInf : isFailingNumberAllowingInf;
  /** @type {null | ((x: any) => boolean)} */
  let keyBad;
  if (key !== undefined) {
    if (key === 'number') {
      // Mirrors `validateNumber` exactly, `Infinity` included.
      keyBad = numberBad;
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
      valBad = numberBad;
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
export {firstBadEntry};
