/**
 * @param {number[]} arr - A number array.
 * @param {Record<string, number>} obj - An object with number values.
 * @param {number} i - An index.
 * @param {number} j - Another index.
 * @returns {number} The sum of all reads.
 */
function indexAccess(arr, obj, i, j) {
  const a = arr[i];
  const b = obj['val'];
  arr[0] = 42.0;
  const c = arr[10];
  const s = 'hello'[1];
  const m = arr[i][j];
  return a + b + c + s;
}
indexAccess([1, 2, 3], {val: 4}, 1, 1);