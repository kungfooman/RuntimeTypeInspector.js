import {substituteArray} from "./substituteArray.js";
import {substituteRecord} from "./substituteRecord.js";
import {substituteDescriptors} from "./substituteDescriptors.js";
import {substitutes, recurseSubstitute} from "./substitutes.js";
/**
 * Populates the dispatch table: every edge points outward from here, so the
 * module graph stays acyclic. Importing this module (or the package index)
 * guarantees a full table. Shorthand keys mirror the export names.
 */
Object.assign(substitutes, {
  substituteType,
  substituteArray,
  substituteRecord,
  substituteDescriptors,
});
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
      const inner = recurseSubstitute(type.type, search, replace, warn);
      return inner === type.type ? type : {...type, type: inner};
    }
  }
  switch (type.type) {
    case 'object': {
      const {properties} = type;
      const next = substitutes.substituteRecord(properties, search, replace, warn);
      const signatures = substitutes.substituteArray(type.indexSignatures, search, replace, warn);
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
      const indexType = type.indexType === undefined ? undefined : recurseSubstitute(type.indexType, search, replace, warn);
      const indexParameters = substitutes.substituteDescriptors(type.indexParameters, search, replace, warn);
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
      const elements = substitutes.substituteArray(type.elements, search, replace, warn);
      return elements === type.elements ? type : {...type, elements};
    }
    case 'array': {
      const elementType = recurseSubstitute(type.elementType, search, replace, warn);
      return elementType === type.elementType ? type : {...type, elementType};
    }
    case 'reference': {
      const {args} = type;
      if (!Array.isArray(args)) {
        return type;
      }
      const next = substitutes.substituteArray(args, search, replace, warn);
      return next === args ? type : {...type, args: next};
    }
    case 'promise':
    case 'set':
    case 'class': {
      const elementType = recurseSubstitute(type.elementType, search, replace, warn);
      return elementType === type.elementType ? type : {...type, elementType};
    }
    case 'union': {
      const members = substitutes.substituteArray(type.members, search, replace, warn);
      return members === type.members ? type : {...type, members};
    }
    case 'templateLiteral': {
      const types = substitutes.substituteArray(type.types, search, replace, warn);
      return types === type.types ? type : {...type, types};
    }
    case 'rest': {
      const annotation = recurseSubstitute(type.annotation, search, replace, warn);
      return annotation === type.annotation ? type : {...type, annotation};
    }
    case 'indexedAccess': {
      const index = recurseSubstitute(type.index, search, replace, warn);
      const object = recurseSubstitute(type.object, search, replace, warn);
      return index === type.index && object === type.object ? type : {...type, index, object};
    }
    case 'record':
    case 'map': {
      const key = recurseSubstitute(type.key, search, replace, warn);
      const val = recurseSubstitute(type.val, search, replace, warn);
      return key === type.key && val === type.val ? type : {...type, key, val};
    }
    case 'mapping': {
      // `element` binds the iteration variable: a matching search is
      // shadowed inside and must not be substituted.
      if (type.element === search) {
        return type;
      }
      const iterable = recurseSubstitute(type.iterable, search, replace, warn);
      const result = recurseSubstitute(type.result, search, replace, warn);
      const nameType = type.nameType === undefined ? undefined : recurseSubstitute(type.nameType, search, replace, warn);
      if (iterable === type.iterable && result === type.result && nameType === type.nameType) {
        return type;
      }
      return {...type, iterable, result, nameType};
    }
    case 'intersection': {
      const members = substitutes.substituteArray(type.members, search, replace, warn);
      return members === type.members ? type : {...type, members};
    }
    case 'keyof': {
      const argument = recurseSubstitute(type.argument, search, replace, warn);
      return argument === type.argument ? type : {...type, argument};
    }
    case 'condition': {
      const checkType = recurseSubstitute(type.checkType, search, replace, warn);
      const extendsType = recurseSubstitute(type.extendsType, search, replace, warn);
      const trueType = recurseSubstitute(type.trueType, search, replace, warn);
      const falseType = recurseSubstitute(type.falseType, search, replace, warn);
      if (checkType === type.checkType && extendsType === type.extendsType &&
        trueType === type.trueType && falseType === type.falseType) {
        return type;
      }
      return {...type, checkType, extendsType, trueType, falseType};
    }
    case 'tupleMember': {
      const elementType = recurseSubstitute(type.elementType, search, replace, warn);
      return elementType === type.elementType ? type : {...type, elementType};
    }
    case 'new':
    case 'function': {
      const parameters = substitutes.substituteDescriptors(type.parameters, search, replace, warn);
      const ret = type.ret === undefined ? undefined : recurseSubstitute(type.ret, search, replace, warn);
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
export {substituteType};
