/**
 * @typedef {{a: 'aa', b: 'bb', c: 'cc'}} Obj
 * @typedef {keyof Obj} ObjKeys
 * @typedef {ObjKeys} ObjKeysTypedef
 */
console.log("ObjKeys", typedefs.ObjKeys);
const newType = createType("ObjKeysTypedef", console.warn);
console.log('newType', newType);
