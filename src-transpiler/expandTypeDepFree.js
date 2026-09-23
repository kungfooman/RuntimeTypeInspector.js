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
 * @property {'array' | 'union' | 'record' | 'tuple' | 'object' | 'promise' | 'typeof'} type - The type.
 * @property {object | string} [elementType] - For Array.
 * @property {object | string} [key] - For Record<key, val>
 * @property {object | string} [val] - For Record<key, val>
 * @property {(object | string)[]} [members] - For unions.
 * @property {object | string} [properties] - For objects.
 * @property {(object | string)[]} [elements] - For tuples.
 * @property {object | string} [argument] - For typeof.
 */
/**
 * Splits a string by a delimiter, ignoring delimiters nested inside <>, {}, [], ().
 * @param {string} str - The string to split.
 * @param {string} delimiter - Single character delimiter.
 * @returns {string[]} Top-level split parts.
 */
function splitTopLevel(str, delimiter) {
  const parts = [];
  let depthAngle = 0;
  let depthCurly = 0;
  let depthSquare = 0;
  let depthParen = 0;
  let current = '';
  for (const c of str) {
    if (c === '<') depthAngle++;
    else if (c === '>') depthAngle--;
    else if (c === '{') depthCurly++;
    else if (c === '}') depthCurly--;
    else if (c === '[') depthSquare++;
    else if (c === ']') depthSquare--;
    else if (c === '(') depthParen++;
    else if (c === ')') depthParen--;
    if (c === delimiter && depthAngle === 0 && depthCurly === 0 && depthSquare === 0 && depthParen === 0) {
      parts.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  parts.push(current);
  return parts;
}
/**
 * Parses `Name<A, B>` into name + raw arg strings, respecting nested brackets.
 * Returns undefined when input isn't a generic reference.
 * @param {string} type - Trimmed type string.
 * @returns {{name: string, args: string[]}|undefined} Parsed generic reference.
 */
function parseGenericReference(type) {
  const openIndex = type.indexOf('<');
  if (openIndex === -1 || !type.endsWith('>')) {
    return;
  }
  const name = type.slice(0, openIndex).trim();
  if (!/^[A-Za-z_$][A-Za-z0-9_$.]*$/.test(name)) {
    return;
  }
  // Find matching '>' for the first '<' to ensure outermost brackets wrap the whole type.
  let depth = 0;
  let closeIndex = -1;
  for (let i = openIndex; i < type.length; i++) {
    if (type[i] === '<') depth++;
    else if (type[i] === '>') {
      depth--;
      if (depth === 0) {
        closeIndex = i;
        break;
      }
    }
  }
  if (closeIndex !== type.length - 1) {
    return;
  }
  const inner = type.slice(openIndex + 1, closeIndex);
  const args = splitTopLevel(inner, ',').map((_) => _.trim()).filter((_) => _.length);
  if (!args.length) {
    return;
  }
  return {name, args};
}
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
 * @param {string} type - The input type to expand.
 * @returns {string | ExpandTypeReturnValue} Object containing parsed information from type string.
 */
function expandTypeDepFree(type) {
  type = type.trim();
  // JSDocNullableType (`T?` / `?T`): union with null, matching expandType().
  if (type.endsWith('?') && type.length > 1) {
    return {type: 'union', members: [expandTypeDepFree(type.slice(0, -1).trim()), 'null']};
  }
  if (type.startsWith('?') && type.length > 1) {
    return {type: 'union', members: [expandTypeDepFree(type.slice(1).trim()), 'null']};
  }
  // `readonly T` erased at runtime, same shape as the inner type.
  if (type.startsWith('readonly ') && type.length > 9) {
    return expandTypeDepFree(type.slice(9).trim());
  }
  if (type === 'unique symbol') {
    return 'any';
  }
  // '(123)' -> '123'
  while (!type.includes('|') && type[0] === '(' && type[type.length - 1] === ')') {
    type = type.slice(1, -1).trim();
  }
  // (1) Rest parameters like ...string
  if (type[0] === '.' && type[1] === '.' && type[2] === '.') {
    const elementType = type.slice(3);
    return {type: 'array', elementType};
  }
  // (2)
  // Array<...>
  if (type.startsWith("Array<") && type.endsWith('>')) {
    const typeSlice = type.slice(6, -1);
    const elementType = expandTypeDepFree(typeSlice);
    return {type: "array", elementType};
  }
  // Promise<...>
  if (type.startsWith("Promise<") && type.endsWith('>')) {
    const typeSlice = type.slice(8, -1);
    const elementType = expandTypeDepFree(typeSlice);
    return {type: "promise", elementType};
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
  // (3b) Map<...> / Set<...' for dep-free parity with expandType()
  if (type.startsWith("Map<") && type.endsWith('>')) {
    const inner = type.slice(4, -1);
    const parts = splitTopLevel(inner, ',');
    if (parts.length === 2) {
      return {
        type: "map",
        key: expandTypeDepFree(parts[0].trim()),
        val: expandTypeDepFree(parts[1].trim()),
      };
    }
  }
  if (type.startsWith("Set<") && type.endsWith('>')) {
    const inner = type.slice(4, -1);
    return {
      type: "set",
      elementType: expandTypeDepFree(inner.trim()),
    };
  }
  // (3c) Generic reference types like ArrayLike<T>, ReadonlyArray<T> etc.
  // Keep structured so the runtime can validate them instead of warning 'unchecked'.
  const genericRef = parseGenericReference(type);
  if (genericRef) {
    const {name, args} = genericRef;
    return {type: 'reference', name, args: args.map(expandTypeDepFree)};
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
  // (8) expand typeof expressions
  if (type.startsWith('typeof ')) {
    const argument = expandTypeDepFree(type.substring(7));
    return {type: 'typeof', argument};
  }
  if (type === 'object' || type === 'Object') {
    return {
      type: 'object',
      properties: {},
    };
  }
  // Literal normalization for parity with expandType():
  // numeric literals become numbers, true/false become booleans.
  if (type === 'true') {
    return true;
  }
  if (type === 'false') {
    return false;
  }
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(type)) {
    return Number(type);
  }
  return type;
}
export {expandTypeDepFree};
