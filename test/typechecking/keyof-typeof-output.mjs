registerTypedef('ObjKey', {
  "type": "keyof",
  "argument": {
    "type": "typeof",
    "argument": "obj"
  }
});
registerTypedef('DataType', {
  "type": "keyof",
  "argument": {
    "type": "typeof",
    "argument": "DataTypeMap"
  }
});
/** @todo keep in one line */
const obj = {
  a: 1,
  b: 2,
  c: 3
};
registerVariable('obj', obj);
/**
 * @typedef {keyof typeof obj} ObjKey - Will be: "a" | "b" | "c"
 */
const DataTypeMap = Object.freeze({
  float32: Float32Array,
  float64: Float64Array,
  string: Array,
  int8: Int8Array,
  uint8: Uint8Array,
  int16: Int16Array,
  uint16: Uint16Array,
  int32: Int32Array,
  uint32: Uint32Array,
  int64: BigInt64Array,
  uint64: BigUint64Array,
  bool: Uint8Array,
});
registerVariable('DataTypeMap', DataTypeMap);
/**
 * @typedef {keyof typeof DataTypeMap} DataType
 */
