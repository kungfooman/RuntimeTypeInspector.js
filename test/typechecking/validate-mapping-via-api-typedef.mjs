registerTypedef('TestObject', expandType(`{a: 'aa', b: 'bb', c: 'cc'}`));
console.log("typedefs", typedefs);
const str = `{
  [Key in 1|2|3]: {
    td: TestObject,
    testkey: [Key, Key, Key],
    bla: Key,
  }
}`;
const mapping = expandType(str);
const type = createTypeFromMapping(mapping, console.warn);
const key = type.properties[1].properties.bla;
console.log(`The key should be 1: ${key} (${key === 1})`, {type});
console.log(JSON.stringify(type, null, 2));
