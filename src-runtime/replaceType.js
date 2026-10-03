/**
 * @todo
 *  - To prevent circularity, check that "search" isn't in "replace" in the first place?
 *  - add depth argument
 *  - add bunch of unit tests to test all possible cases
 *  - add intersection type replacements for instance: 'fixed' & Key
 * Pure (never mutates its input): unchanged subtrees are shared by identity
 * with the input, so only the rewrite path allocates — and downstream
 * identity memos keep hitting across substitutions. Callers must use the
 * return value; nothing is modified in place.
 * @param {*} type - The type.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {*} warn - The warn.
 * @returns {any} - Substituted copy, sharing every unchanged subtree.
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
      const inner = replaceType(type.type, search, replace, warn);
      return inner === type.type ? type : {...type, type: inner};
    }
  }
  switch (type.type) {
    case 'object': {
      const {properties} = type;
      const next = replaceRecord(properties, search, replace, warn);
      const signatures = replaceArray(type.indexSignatures, search, replace, warn);
      if (next === properties && signatures === type.indexSignatures) {
        return type;
      }
      // `{[k: string]: T}` value positions instantiate like properties.
      const out = {...type};
      if (next !== properties) {
        out.properties = next;
      }
      if (signatures !== type.indexSignatures) {
        out.indexSignatures = signatures;
      }
      return out;
    }
    case 'indexSignature': {
      const indexType = type.indexType === undefined ? undefined : replaceType(type.indexType, search, replace, warn);
      const indexParameters = replaceDescriptors(type.indexParameters, search, replace, warn);
      if (indexType === type.indexType && indexParameters === type.indexParameters) {
        return type;
      }
      // Parameter descriptors `{type, name}`: only `.type` is a type position.
      return {...type, indexType, indexParameters};
    }
    case 'typeof':
      // `typeof X` names a value, not a type: a same-named template must not
      // rewrite it. Silent no-op (previously warned `@todo unhandled` on every
      // templated function that merely had a typeof-typed param).
      return type;
    case 'tuple': {
      const elements = replaceArray(type.elements, search, replace, warn);
      return elements === type.elements ? type : {...type, elements};
    }
    case 'array': {
      const elementType = replaceType(type.elementType, search, replace, warn);
      return elementType === type.elementType ? type : {...type, elementType};
    }
    case 'reference': {
      const {args} = type;
      if (!Array.isArray(args)) {
        return type;
      }
      const next = replaceArray(args, search, replace, warn);
      return next === args ? type : {...type, args: next};
    }
    case 'promise':
    case 'set':
    case 'class': {
      const elementType = replaceType(type.elementType, search, replace, warn);
      return elementType === type.elementType ? type : {...type, elementType};
    }
    case 'union': {
      const members = replaceArray(type.members, search, replace, warn);
      return members === type.members ? type : {...type, members};
    }
    case 'templateLiteral': {
      const types = replaceArray(type.types, search, replace, warn);
      return types === type.types ? type : {...type, types};
    }
    case 'rest': {
      const annotation = replaceType(type.annotation, search, replace, warn);
      return annotation === type.annotation ? type : {...type, annotation};
    }
    case 'indexedAccess': {
      const index = replaceType(type.index, search, replace, warn);
      const object = replaceType(type.object, search, replace, warn);
      return index === type.index && object === type.object ? type : {...type, index, object};
    }
    case 'record':
    case 'map': {
      const key = replaceType(type.key, search, replace, warn);
      const val = replaceType(type.val, search, replace, warn);
      return key === type.key && val === type.val ? type : {...type, key, val};
    }
    case 'mapping': {
      // `element` binds the iteration variable: a matching search is
      // shadowed inside and must not be substituted.
      if (type.element === search) {
        return type;
      }
      const iterable = replaceType(type.iterable, search, replace, warn);
      const result = replaceType(type.result, search, replace, warn);
      const nameType = type.nameType === undefined ? undefined : replaceType(type.nameType, search, replace, warn);
      if (iterable === type.iterable && result === type.result && nameType === type.nameType) {
        return type;
      }
      return {...type, iterable, result, nameType};
    }
    case 'intersection': {
      const members = replaceArray(type.members, search, replace, warn);
      return members === type.members ? type : {...type, members};
    }
    case 'keyof': {
      const argument = replaceType(type.argument, search, replace, warn);
      return argument === type.argument ? type : {...type, argument};
    }
    case 'condition': {
      const checkType = replaceType(type.checkType, search, replace, warn);
      const extendsType = replaceType(type.extendsType, search, replace, warn);
      const trueType = replaceType(type.trueType, search, replace, warn);
      const falseType = replaceType(type.falseType, search, replace, warn);
      if (checkType === type.checkType && extendsType === type.extendsType &&
        trueType === type.trueType && falseType === type.falseType) {
        return type;
      }
      return {...type, checkType, extendsType, trueType, falseType};
    }
    case 'tupleMember': {
      const elementType = replaceType(type.elementType, search, replace, warn);
      return elementType === type.elementType ? type : {...type, elementType};
    }
    case 'new':
    case 'function': {
      const parameters = replaceDescriptors(type.parameters, search, replace, warn);
      const ret = type.ret === undefined ? undefined : replaceType(type.ret, search, replace, warn);
      if (parameters === type.parameters && ret === type.ret) {
        return type;
      }
      return {...type, parameters, ret};
    }
    default:
      warn('replaceType: @todo unhandled', {type, search, replace});
      break;
  }
  return type;
}
/**
 * Substitutes an array of types, returning the original when nothing
 * changed so unchanged subtrees keep their identity for downstream memos.
 * @param {any[]|undefined} items - Type array or undefined.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {any[]|undefined} Substituted array or the original.
 */
function replaceArray(items, search, replace, warn) {
  if (!Array.isArray(items)) {
    return items;
  }
  let out = items;
  for (let i = 0; i < items.length; i++) {
    const next = replaceType(items[i], search, replace, warn);
    if (next !== items[i]) {
      if (out === items) {
        out = items.slice(0, i);
      }
      out.push(next);
    } else if (out !== items) {
      out.push(items[i]);
    }
  }
  return out;
}
/**
 * Substitutes a record of types (e.g. object properties), returning the
 * original when nothing changed.
 * @param {Record<string, *>|undefined} record - Type record or undefined.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {Record<string, *>|undefined} Substituted record or the original.
 */
function replaceRecord(record, search, replace, warn) {
  if (record === null || typeof record !== 'object') {
    return record;
  }
  let out = record;
  for (const prop in record) {
    const next = replaceType(record[prop], search, replace, warn);
    if (next !== record[prop]) {
      if (out === record) {
        out = {...record};
      }
      out[prop] = next;
    }
  }
  return out;
}
/**
 * Substitutes parameter descriptors (`{type, name}`), touching only each
 * descriptor's `.type` position and preserving identity when unchanged.
 * @param {any[]|undefined} parameters - Descriptors or undefined.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {any[]|undefined} Substituted descriptors or the original.
 */
function replaceDescriptors(parameters, search, replace, warn) {
  if (!Array.isArray(parameters)) {
    return parameters;
  }
  let out = parameters;
  for (let i = 0; i < parameters.length; i++) {
    const parameter = parameters[i];
    if (parameter && typeof parameter === 'object' && parameter.type !== undefined) {
      const next = replaceType(parameter.type, search, replace, warn);
      if (next !== parameter.type) {
        if (out === parameters) {
          out = parameters.slice();
        }
        out[i] = {...parameter, type: next};
      }
    }
  }
  return out;
}
export {replaceType};
