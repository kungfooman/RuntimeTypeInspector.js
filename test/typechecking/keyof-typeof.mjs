const DataTypeMap = Object.freeze({
  float32: Float32Array,
  float64: Float64Array,
});
/**
 * @typedef {keyof typeof DataTypeMap} DataType
 */
/**
 * @param {DataType} a - Test argument.
 * @returns {DataType} Same as input.
 */
function identity(a) {
  return a;
}
identity(1); // Bad call
identity('float32'); // Good call
