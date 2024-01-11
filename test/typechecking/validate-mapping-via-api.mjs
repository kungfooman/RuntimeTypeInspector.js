const str = '{[Key in 1|2|3]: {testkey: [Key, Key, Key], bla: Key}}';
const mapping = expandType(str);
const type = createTypeFromMapping(mapping);
const keys = Object.values(type.properties).map(_ => _.properties.bla);
const ret = keys[0] === 1 && keys[1] === 2 && keys[2] === 3;
console.log(`The keys should be [1, 2, 3]: ${keys} (${ret})`, {keys, type});
