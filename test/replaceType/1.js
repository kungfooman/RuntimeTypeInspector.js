// Mode: eval
registerTypedef('TestObject', expandType(`{a: 'aa', b: 'bb', c: 'cc'}`));
console.log("typedefs", typedefs);
const mapping = expandType(`{
  [Key in 1|2]: {
    td: TestObject,
    testkey: [Key, Key, Key],
    bla: Key,
    testArr: Key[],
    testUnion: 'fixed'|Key,
  }
}`);
const type = createTypeFromMapping(mapping, console.warn);
const key = type.properties[1].properties.bla;
console.log(`The key should be 1: ${key} (${key === 1})`, {type});
function stringify(_) {
  let ret = JSON.stringify(_, null, 2);
  const regExp = /\[[\n ,0-9]*?\]/gm;
  ret = ret.replace(regExp, (all) => {
    return all.replace(/\n| /g, '');
  });
  // Turn this: "type": "array"
  // Into this: type:  "array"
  ret = ret.replaceAll(/\"([a-zA-Z0-9]+)\":+/g, "$1: ");
  return ret;
}
function a() {
  //const type = expandType("number|T");
  //const type = expandType("[T, T, T]");
  const type = expandType("T[]");
  //const type = expandType("string");
  const newType = replaceType(type, 'T', 'string', console.warn);
  return stringify(newType);
}
setRight(stringify(type) + '\n\n' + a());
