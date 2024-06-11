registerTypedef('TypedArray', {
  "type": "union",
  "members": [
    "Int8Array",
    "Uint8Array",
    "Uint8ClampedArray",
    "Int16Array",
    "Uint16Array",
    "Int32Array",
    "Uint32Array",
    "Float32Array",
    "Float64Array"
  ]
});
registerTypedef('BigTypedArray', {
  "type": "union",
  "members": [
    "BigInt64Array",
    "BigUint64Array"
  ]
});
registerTypedef('AnyTypedArray', {
  "type": "union",
  "members": [
    "TypedArray",
    "BigTypedArray"
  ]
});
/**
 * @typedef {Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array} TypedArray
 * @typedef {BigInt64Array | BigUint64Array} BigTypedArray
 * @typedef {TypedArray | BigTypedArray} AnyTypedArray
 */

/**
 * Helper method to permute a `AnyTypedArray` directly
 *
 * @template {AnyTypedArray} T
 * @param {T} array - The input array.
 * @param {number[]} dims - The dimensions.
 * @param {number[]} axes - The axes.
 * @returns {[T, number[]]} The permuted array and the new shape.
 */
export function permute_data(array, dims, axes) {
  const rtiTemplates = {
    "T": "AnyTypedArray"
  };
  if (!inspectTypeWithTemplates(array, "T", 'permute_data', 'array', rtiTemplates)) {
    youCanAddABreakpointHere();
  }
  if (!inspectTypeWithTemplates(dims, {
    "type": "array",
    "elementType": "number",
    "optional": false
  }, 'permute_data', 'dims', rtiTemplates)) {
    youCanAddABreakpointHere();
  }
  if (!inspectTypeWithTemplates(axes, {
    "type": "array",
    "elementType": "number",
    "optional": false
  }, 'permute_data', 'axes', rtiTemplates)) {
    youCanAddABreakpointHere();
  }
  // Calculate the new shape of the permuted array
  // and the stride of the original array
  const shape = new Array(axes.length);
  const stride = new Array(axes.length);
  for (let i = axes.length - 1, s = 1; i >= 0; --i) {
    stride[i] = s;
    shape[i] = dims[axes[i]];
    s *= shape[i];
  }
  // Precompute inverse mapping of stride
  const invStride = axes.map((_, i) => {
    return stride[axes.indexOf(i)];
  });
  // Create the permuted array with the new shape
  // @ts-ignore
  // Create the permuted array with the new shape
  // @ts-ignore
  const permutedData = new array.constructor(array.length);
  // Permute the original array to the new array
  for (let i = 0; i < array.length; ++i) {
    let newIndex = 0;
    for (let j = dims.length - 1, k = i; j >= 0; --j) {
      newIndex += (k % dims[j]) * invStride[j];
      k = Math.floor(validateDivision(k, dims[j], "permute_data"));
    }
    permutedData[newIndex] = array[i];
  }
  return [permutedData, shape];
}
const arr = new Float32Array([1, 2, 3, 4]);
//const arr = [1, 2, 3, 4]; // Should fail, since it's no typed array.
const dims = [2, 2];
const axes = [1, 0];
const [permutedData, shape] = permute_data(arr, dims, axes);
const tmp = {
  arr,
  dims,
  axes,
  permutedData,
  shape
};
console.log(JSON.stringify(tmp, null, 2));
