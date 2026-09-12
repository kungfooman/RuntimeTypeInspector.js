/**
 * @param {number[]} arr - A number array.
 * @param {Record<string, number>} obj - An object with number values.
 * @param {number} i - An index.
 * @param {number} j - Another index.
 * @returns {number} The sum of all reads.
 */
function indexAccess(arr, obj, i, j) {
  if (!inspectType(arr, {
    "type": "array",
    "elementType": "number",
    "optional": false
  }, 'indexAccess', 'arr')) {
    youCanAddABreakpointHere();
  }
  if (!inspectType(obj, {
    "type": "record",
    "key": "string",
    "val": "number",
    "optional": false
  }, 'indexAccess', 'obj')) {
    youCanAddABreakpointHere();
  }
  if (!inspectType(i, "number", 'indexAccess', 'i')) {
    youCanAddABreakpointHere();
  }
  if (!inspectType(j, "number", 'indexAccess', 'j')) {
    youCanAddABreakpointHere();
  }
  const a = inspectIndexedAccess(arr, i, "indexAccess");
  const b = inspectIndexedAccess(obj, 'val', "indexAccess");
  arr[0] = 42.0;
  const c = inspectIndexedAccess(arr, 10, "indexAccess");
  const s = inspectIndexedAccess('hello', 1, "indexAccess");
  const m = inspectIndexedAccess(inspectIndexedAccess(arr, i, "indexAccess"), j, "indexAccess");
  return a + b + c + s;
}
indexAccess([1, 2, 3], {
  val: 4
}, 1, 1);