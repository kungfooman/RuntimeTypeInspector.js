/**
 * @todo
 *  - To prevent circularity, check that "search" isn't in "replace" in the first place?
 *  - add depth argument
 *  - add bunch of unit tests to test all possible cases
 *  - call it copyAndReplace?
 *  - if a subtype is a typedef and we change that without creating a copy, we invalidate that typedef... make a unit test
 *  - add intersection type replacements for instance: 'fixed' & Key
 * @param {*} type - The type.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {*} warn - The warn.
 * @returns {any} - In-place replaced version of the structured type.
 */
function replaceType(type, search, replace, warn) {
  if (type === search) {
    // console.log("replaceType", {type, search, replace, warn});
    return replace;
  }
  if (type === null || typeof type !== 'object') {
    // Bare names, literals and modifiers pass through untouched: only the
    // searched template key is substituted, everything else keeps its shape.
    return type;
  }
  // Annotated atoms like `{type: 'T', optional: true}` (what annotateOptional
  // emits for optional bare params, e.g. `@param {T} [a]`): substitute inside
  // `.type` so optional/nullable template params actually instantiate instead
  // of warning `unchecked`/`@todo unhandled`. Restricted to pure flag
  // wrappers (no structural fields) so real discriminators (e.g. a template
  // literally named `array`) are never rewritten.
  if (typeof type.type === 'string' || typeof type.type === 'number' || typeof type.type === 'boolean') {
    const keys = Object.keys(type);
    if (keys.every((key) => key === 'type' || key === 'optional' || key === 'readonly')) {
      type.type = replaceType(type.type, search, replace, warn);
      return type;
    }
  }
  switch (type.type) {
    case 'object': {
      const {properties} = type;
      // todo I need unit tests making sure I don't need a full copy
      // const newProperties = {};
      for (const prop in properties) {
        const val = properties[prop];
        properties[prop] = replaceType(val, search, replace, warn);
      }
      if (Array.isArray(type.indexSignatures)) {
        // `{[k: string]: T}` value positions instantiate like properties.
        for (let i = 0; i < type.indexSignatures.length; i++) {
          type.indexSignatures[i] = replaceType(type.indexSignatures[i], search, replace, warn);
        }
      }
      return type;
    }
    case 'indexSignature': {
      if (type.indexType !== undefined) {
        type.indexType = replaceType(type.indexType, search, replace, warn);
      }
      if (Array.isArray(type.indexParameters)) {
        // Parameter descriptors `{type, name}`: only `.type` is a type position.
        for (const parameter of type.indexParameters) {
          if (parameter && typeof parameter === 'object' && parameter.type !== undefined) {
            parameter.type = replaceType(parameter.type, search, replace, warn);
          }
        }
      }
      return type;
    }
    case 'typeof':
      // `typeof X` names a value, not a type: a same-named template must not
      // rewrite it. Silent no-op (previously warned `@todo unhandled` on every
      // templated function that merely had a typeof-typed param).
      return type;
    case 'tuple': {
      const {elements} = type;
      const {length  } = elements;
      for (let i = 0; i < length; i++) {
        const element = elements[i];
        elements[i] = replaceType(element, search, replace, warn);
      }
      return type;
    }
    case 'array':
      type.elementType = replaceType(type.elementType, search, replace, warn);
      return type;
    case 'reference': {
      const {args} = type;
      if (Array.isArray(args)) {
        for (let i = 0; i < args.length; i++) {
          args[i] = replaceType(args[i], search, replace, warn);
        }
      }
      return type;
    }
    case 'promise':
    case 'set':
    case 'class':
      type.elementType = replaceType(type.elementType, search, replace, warn);
      return type;
    case 'union': {
      const {members} = type;
      const {length } = members;
      for (let i = 0; i < length; i++) {
        const member = members[i];
        members[i] = replaceType(member, search, replace, warn);
      }
      return type;
    }
    case 'templateLiteral': {
      const {types} = type;
      const {length} = types;
      for (let i = 0; i < length; i++) {
        const member = types[i];
        types[i] = replaceType(member, search, replace, warn);
      }
      return type;
    }
    case 'rest': {
      type.annotation = replaceType(type.annotation, search, replace, warn);
      return type;
    }
    case 'indexedAccess':
      type.index = replaceType(type.index, search, replace, warn);
      type.object = replaceType(type.object, search, replace, warn);
      return type;
    case 'record':
    case 'map':
      type.key = replaceType(type.key, search, replace, warn);
      type.val = replaceType(type.val, search, replace, warn);
      return type;
    case 'mapping': {
      // `element` binds the iteration variable: a matching search is
      // shadowed inside and must not be substituted.
      if (type.element === search) {
        return type;
      }
      type.iterable = replaceType(type.iterable, search, replace, warn);
      type.result = replaceType(type.result, search, replace, warn);
      if (type.nameType !== undefined) {
        type.nameType = replaceType(type.nameType, search, replace, warn);
      }
      return type;
    }
    case 'intersection': {
      const {members} = type;
      for (let i = 0; i < members.length; i++) {
        members[i] = replaceType(members[i], search, replace, warn);
      }
      return type;
    }
    case 'keyof':
      type.argument = replaceType(type.argument, search, replace, warn);
      return type;
    case 'condition':
      type.checkType = replaceType(type.checkType, search, replace, warn);
      type.extendsType = replaceType(type.extendsType, search, replace, warn);
      type.trueType = replaceType(type.trueType, search, replace, warn);
      type.falseType = replaceType(type.falseType, search, replace, warn);
      return type;
    case 'tupleMember':
      type.elementType = replaceType(type.elementType, search, replace, warn);
      return type;
    case 'new': {
      const {parameters} = type;
      if (Array.isArray(parameters)) {
        for (const parameter of parameters) {
          if (parameter && typeof parameter === 'object' && parameter.type !== undefined) {
            parameter.type = replaceType(parameter.type, search, replace, warn);
          }
        }
      }
      if (type.ret !== undefined) {
        type.ret = replaceType(type.ret, search, replace, warn);
      }
      return type;
    }
    case 'function': {
      const {parameters} = type;
      if (Array.isArray(parameters)) {
        for (const parameter of parameters) {
          if (parameter && typeof parameter === 'object' && parameter.type !== undefined) {
            parameter.type = replaceType(parameter.type, search, replace, warn);
          }
        }
      }
      return type;
    }
    default:
      warn('replaceType: @todo unhandled', {type, search, replace});
      break;
  }
  return type;
}
export {replaceType};
