/**
 * @todo expandTypeDepFree doesn't support "complicated" types.
 * For actual builds, we use expandType() anyway (which is based on TypeScript).
 * But since TypeScript is a huge dependency, I'm looking into BabelFlow/BabelTypescript parser.
 * Comparing AST's like this usually helps to find bugs or potential issues,
 * while we can benchmark for best performance too.
 * @example
 * const tooComplex = 'Array<string|{chunks?: undefined|Array<{language: string|null, timestamp: Array<number|null>, text: string}>}>';
 * console.log(expandTypeDepFree(tooComplex));
 */
/**
 * @typedef {object} ExpandTypeReturnValue
 * @property {'array' | 'union' | 'record' | 'tuple' | 'object'} type
 * @property {object | string} [elementType]
 * @property {object | string} [key]
 * @property {object | string} [val]
 * @property {(object | string)[]} [members] - For unions.
 * @property {object | string} [properties] - For objects.
 * @property {(object | string)[]} [elements] - For tuples.
 */
/**
 * 'DepFree' refers to the fact that this function has no dependencies,
 * while `expandType` depends on TypeScript itself for maximum compatibility.
 * @example
 * expandTypeDepFree('(123)                   '); // Outputs: '123'
 * expandTypeDepFree('Array<number>           '); // Outputs: { type: 'array', elementType: 'number' }
 * expandTypeDepFree('Array<(123) >           '); // Outputs: { type: 'array', elementType: '123' }
 * expandTypeDepFree('  ( ( 123 ) )           '); // Outputs: '123'
 * expandTypeDepFree('  (string ) |(number )  '); // Outputs: { type: 'union', members: ['string', 'number'] }
 * expandTypeDepFree(' ((  Object  ) )        '); // Outputs: { type: 'object', properties: {} }
 * @param {string} type
 * @returns {string | ExpandTypeReturnValue} Object containing parsed information from type string.
 */
function expandTypeDepFree(type) {
  type = type.trim();
  // '(123)' -> '123'
  while (!type.includes('|') && type[0] === '(' && type[type.length - 1] === ')') {
    type = type.slice(1, -1).trim();
  }
  // (1) Rest parameters like ...string
  if (type[0] === '.' && type[1] === '.' && type[2] === '.') {
    return {
      type: 'array',
      elementType: type.slice(3)
    };
  }
  // (2) Array<...>
  if (type.startsWith("Array<") && type.endsWith('>')) {
    const typeSlice = type.slice(6, -1);
    return {
      type: "array",
      elementType: expandTypeDepFree(typeSlice)
    };
  }
  // (3) Object<...> or Record<...>
  if (
    (
      type.startsWith("Object<") ||
      type.startsWith("Record<")
    ) && type.endsWith('>')) {
    const recordSlice = type.slice(7, -1);
    const firstComma = recordSlice.indexOf(',');
    if (firstComma === -1) {
      console.warn("expandTypeDepFree> invalid Object/Record");
    }
    const key = recordSlice.slice(0, firstComma).trim();
    const val = recordSlice.slice(firstComma + 1).trim();
    return {
      type: "record",
      key: expandTypeDepFree(key),
      val: expandTypeDepFree(val),
    };
  }
  // (4) {...}
  if (type[0] === '{' && type[type.length - 1] === '}') {
    const propertiesArray = type.slice(1, -1).split(','); // ['entity: Entity', ' app: AppBase']
    const properties = {};
    propertiesArray.forEach(_ => {
      const [propName, propType] = _.split(":").map(_ => _.trim());
      if (!propName || !propType) {
        console.warn('expandTypeDepFree> unexpected type format, fix');
        return false;
      }
      properties[propName] = propType;
    });
    return {type: 'object', properties};
  }
  // (5) expand unions
  const members = type.split("|");
  if (members.length >= 2) {
    members.forEach((_, i) => members[i] = _.trim());
    return {
      type: 'union',
      members: members.map(expandTypeDepFree),
    };
  }
  // (6) expand [] Arrays
  // Test arrays: new pc.Mat3().set([1, 2, 3, "asd"])
  if (type.endsWith("[]")) {
    const typeSlice = type.slice(0, -2);
    return {
      type: 'array',
      elementType: expandTypeDepFree(typeSlice)
    };
  }
  // (7) expand tuples
  if (type[0] === '[' && type[type.length - 1] === ']') {
    const elements = type.slice(1, -1).split(','); // ['null', ' Texture', ' Texture', ' Texture', ' Texture', ' Texture', ' Texture']
    return {
      type: 'tuple',
      elements: elements.map(expandTypeDepFree)
    };
  }
  if (type === 'object' || type === 'Object') {
    return {
      type: 'object',
      properties: {},
    };
  }
  return type;
}
export {expandTypeDepFree};
