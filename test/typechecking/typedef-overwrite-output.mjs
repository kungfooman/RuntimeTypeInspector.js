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
