/**
 * This also works for an empty array, unlike `Array#every`.
 * @example
 * const a = [];
 * a.length = 10;
 * typecheckEvery(a, (e, i) => {console.log(e); return true;}
 * @param {*[]} arr - The array to test.
 * @param {Function} fn - The callback function to test each element with.
 * @returns {boolean} True if every callback call is true aswell.
 */
function typecheckEvery(arr, fn) {
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    const ret = fn(arr[i], i, arr);
    if (!ret) {
      return false;
    }
  }
  return true;
}
export {typecheckEvery};
