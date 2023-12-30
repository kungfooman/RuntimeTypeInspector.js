/**
 * @example
 * const isLawyer = _ => _ === '👩‍⚖️' || _ === '👨‍⚖️';
 * partition(['👨‍⚕️', '👩‍⚖️', '👩‍✈️', '👨‍✈️', '👨‍⚖️'], isLawyer);
 * // Result: [[👩‍⚖️, 👨‍⚖️], [👨‍⚕️, 👩‍✈️, 👨‍✈️]]
 * @template T
 * @param {T[]} arr - Input array.
 * @param {(element: T) => boolean} fn - Discriminator of array elements.
 * @returns {[pass: T[], fail: any[]]} Tuple of pass/fail arrays.
 */
function partition(arr, fn) {
  /** @type {T[]} */
  const pass = [];
  /** @type {any[]} */
  const fail = [];
  for (const element of arr) {
    const arr = fn(element) ? pass : fail;
    arr.push(element);
  }
  return [pass, fail];
}
export {partition};
