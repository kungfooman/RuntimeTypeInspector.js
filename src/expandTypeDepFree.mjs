/**
 * 'DepFree' refers to the fact that this function has no dependencies,
 * while `expandType` depends on TypeScript itself for maximum compatibility.
 * @example
 * expandTypeDepFree("(123)        "); // Outputs: 123
 * expandTypeDepFree("Array<number>"); // Outputs: {type: 'array', elementType: 'number'}
 * expandTypeDepFree("Array<(123) >"); // Outputs: {type: 'array', elementType: '123'}
 * @param {string} type
 */
function expandTypeDepFree(type) {
  type = type.trim();
  // '(123)' -> '123'
  if (type[0] == '(' && type[type.length - 1] == ')') {
    type = type.slice(1, -1);
  }
  type = type.trim();
  // First priority: Array<...>
  if (type.startsWith("Array<") && type.endsWith('>')) {
    const typeSlice = type.slice(6, -1);
    return {
      type: "array",
      elementType: expandType(typeSlice)
    }
  }
  // Second priority:
  //  - Object<...>
  //  - Record<...>
  if (
    (
      type.startsWith("Object<") ||
      type.startsWith("Record<")
    ) && type.endsWith('>')) {
    const recordSlice = type.slice(7, -1);
    const firstComma = recordSlice.indexOf(',');
    if (firstComma === -1) {
      console.warn("expandType> invalid Object/Record");
    }
    const key = recordSlice.slice(0, firstComma).trim();
    const val = recordSlice.slice(firstComma + 1).trim();
    return {
      type: "record",
      key: expandType(key),
      val: expandType(val),
    }
  }
  // Third priority: { ... }
  if (type[0] == '{' && type[type.length - 1] == '}') {
    const propertiesArray = type.slice(1, -1).split(','); // ['entity: Entity', ' app: AppBase']
    const properties = {};
    propertiesArray.forEach(_ => {
      const [propName, propType] = _.split(":").map(_=>_.trim());
      if (!propName || !propType) {
        console.warn('expandType> unexpected type format, fix');
        return false;
      }
      properties[propName] = propType;
    });
    return {type: 'object', properties};
  }
  // Fourth priority: expand unions
  const members = type.split("|");
  if (members.length >= 2) {
    members.forEach((_, i) => members[i]=_.trim());
    return {
      type: 'union',
      members: members.map(expandType),
    }
  }
  // Fifth priority: expand [] Arrays
  // Test arrays: new pc.Mat3().set([1, 2, 3, "asd"])
  if (type.endsWith("[]")) {
    const typeSlice = type.slice(0, -2);
    return {
      type: 'array',
      elementType: expandType(typeSlice)
    }
  }
  // Sixth priority: expand tuples
  if (type[0] == '[' && type[type.length - 1] == ']') {
    const properties = type.slice(1, -1).split(','); // ['null', ' Texture', ' Texture', ' Texture', ' Texture', ' Texture', ' Texture']
    return {
      type: 'tuple',
      properties: properties.map(expandType)
    }
  }
  if (type === 'object') {
    type = {
      type: 'object',
      properties: {},
    }
  }
  return type;
}
export { expandTypeDepFree };
