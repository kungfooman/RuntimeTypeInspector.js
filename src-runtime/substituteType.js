/**
 * Substitutes template references, purely: never mutates its input, and
 * unchanged subtrees are shared by identity with the input, so only the
 * rewrite path allocates — downstream identity memos keep hitting across
 * substitutions. Callers must use the return value. Single-pass (an
 * inserted replacement is never re-scanned), so a search occurring inside
 * its own replacement cannot loop; inputs must still be finite trees,
 * which holds for transpiled expects by construction. Per-branch contract:
 * substituteType.spec.js (including intersection members like `'fixed'`
 * alongside the key).
 * @param {*} type - The type.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {*} warn - The warn.
 * @returns {any} - Substituted copy, sharing every unchanged subtree.
 * @example
 * substituteType({type: 'object', properties: {a: 'K'}}, 'K', '"a"', console.warn);
 * // {type: 'object', properties: {a: '"a"'}}
 */
function substituteType(type, search, replace, warn) {
  if (type === search) {
    // console.log("substituteType", {type, search, replace, warn});
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
      const inner = substituteType(type.type, search, replace, warn);
      return inner === type.type ? type : {...type, type: inner};
    }
  }
  switch (type.type) {
    case 'object': {
      const {properties} = type;
      const next = substituteRecord(properties, search, replace, warn);
      const signatures = substituteArray(type.indexSignatures, search, replace, warn);
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
      const indexType = type.indexType === undefined ? undefined : substituteType(type.indexType, search, replace, warn);
      const indexParameters = substituteDescriptors(type.indexParameters, search, replace, warn);
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
      const elements = substituteArray(type.elements, search, replace, warn);
      return elements === type.elements ? type : {...type, elements};
    }
    case 'array': {
      const elementType = substituteType(type.elementType, search, replace, warn);
      return elementType === type.elementType ? type : {...type, elementType};
    }
    case 'reference': {
      const {args} = type;
      if (!Array.isArray(args)) {
        return type;
      }
      const next = substituteArray(args, search, replace, warn);
      return next === args ? type : {...type, args: next};
    }
    case 'promise':
    case 'set':
    case 'class': {
      const elementType = substituteType(type.elementType, search, replace, warn);
      return elementType === type.elementType ? type : {...type, elementType};
    }
    case 'union': {
      const members = substituteArray(type.members, search, replace, warn);
      return members === type.members ? type : {...type, members};
    }
    case 'templateLiteral': {
      const types = substituteArray(type.types, search, replace, warn);
      return types === type.types ? type : {...type, types};
    }
    case 'rest': {
      const annotation = substituteType(type.annotation, search, replace, warn);
      return annotation === type.annotation ? type : {...type, annotation};
    }
    case 'indexedAccess': {
      const index = substituteType(type.index, search, replace, warn);
      const object = substituteType(type.object, search, replace, warn);
      return index === type.index && object === type.object ? type : {...type, index, object};
    }
    case 'record':
    case 'map': {
      const key = substituteType(type.key, search, replace, warn);
      const val = substituteType(type.val, search, replace, warn);
      return key === type.key && val === type.val ? type : {...type, key, val};
    }
    case 'mapping': {
      // `element` binds the iteration variable: a matching search is
      // shadowed inside and must not be substituted.
      if (type.element === search) {
        return type;
      }
      const iterable = substituteType(type.iterable, search, replace, warn);
      const result = substituteType(type.result, search, replace, warn);
      const nameType = type.nameType === undefined ? undefined : substituteType(type.nameType, search, replace, warn);
      if (iterable === type.iterable && result === type.result && nameType === type.nameType) {
        return type;
      }
      return {...type, iterable, result, nameType};
    }
    case 'intersection': {
      const members = substituteArray(type.members, search, replace, warn);
      return members === type.members ? type : {...type, members};
    }
    case 'keyof': {
      const argument = substituteType(type.argument, search, replace, warn);
      return argument === type.argument ? type : {...type, argument};
    }
    case 'condition': {
      const checkType = substituteType(type.checkType, search, replace, warn);
      const extendsType = substituteType(type.extendsType, search, replace, warn);
      const trueType = substituteType(type.trueType, search, replace, warn);
      const falseType = substituteType(type.falseType, search, replace, warn);
      if (checkType === type.checkType && extendsType === type.extendsType &&
        trueType === type.trueType && falseType === type.falseType) {
        return type;
      }
      return {...type, checkType, extendsType, trueType, falseType};
    }
    case 'tupleMember': {
      const elementType = substituteType(type.elementType, search, replace, warn);
      return elementType === type.elementType ? type : {...type, elementType};
    }
    case 'new':
    case 'function': {
      const parameters = substituteDescriptors(type.parameters, search, replace, warn);
      const ret = type.ret === undefined ? undefined : substituteType(type.ret, search, replace, warn);
      if (parameters === type.parameters && ret === type.ret) {
        return type;
      }
      return {...type, parameters, ret};
    }
    default:
      warn('substituteType: @todo unhandled', {type, search, replace});
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
function substituteArray(items, search, replace, warn) {
  if (!Array.isArray(items)) {
    return items;
  }
  let out = items;
  for (let i = 0; i < items.length; i++) {
    const next = substituteType(items[i], search, replace, warn);
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
function substituteRecord(record, search, replace, warn) {
  if (record === null || typeof record !== 'object') {
    return record;
  }
  let out = record;
  for (const prop in record) {
    const next = substituteType(record[prop], search, replace, warn);
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
function substituteDescriptors(parameters, search, replace, warn) {
  if (!Array.isArray(parameters)) {
    return parameters;
  }
  let out = parameters;
  for (let i = 0; i < parameters.length; i++) {
    const parameter = parameters[i];
    if (parameter && typeof parameter === 'object' && parameter.type !== undefined) {
      const next = substituteType(parameter.type, search, replace, warn);
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
export {substituteType};
