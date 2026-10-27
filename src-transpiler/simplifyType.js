import {isExpandedObject} from './isExpandedObject.js';
import {isIndexSignatureNode} from './isIndexSignatureNode.js';
import {mapValues} from './mapValues.js';
/** @import {ExpandedType} from './expandedType.js' */
/**
 * Recursively clones and simplifies a type for emission into source code.
 * Empty `properties` are preserved (not deleted) and empty `object` types
 * are kept structured: `{type: 'object'}` without a `properties` key is the
 * `{}` literal (accepts every non-nullish value like TS), while
 * `{type: 'object', properties: {}}` is the `object` keyword (rejects
 * primitives). Collapsing either form would erase that distinction.
 * Numbers/booleans (literal types) pass through.
 * Non-destructive — the original type tree is never mutated. Every node
 * carries a literal `type` tag, so each branch narrows by discriminant and
 * reads only keys its tag owns.
 * @param {ExpandedType} type - The type.
 * @returns {ExpandedType} The simplified type.
 */
function simplifyType(type) {
  if (!(type instanceof Object)) {
    return type;
  }
  const out = {...type};
  if (!isExpandedObject(out)) {
    return out;
  }
  if (out.type === 'object' && out.properties) {
    out.properties = mapValues(out.properties, simplifyType);
  }
  if (out.type === 'object' && out.indexSignatures && Array.isArray(out.indexSignatures)) {
    // Simplify first, then keep only intact signatures: the guard runs last
    // so the assignment narrows with no cast, and a corrupt entry that
    // simplification mangles drops out instead of landing in the slot.
    out.indexSignatures = out.indexSignatures.map(simplifyType).filter(isIndexSignatureNode);
  }
  if (out.type === 'union' && out.members) {
    out.members = out.members.map(simplifyType);
  }
  if (out.type === 'intersection' && out.members) {
    out.members = out.members.map(simplifyType);
  }
  if (out.type === 'array' && out.elementType) {
    out.elementType = simplifyType(out.elementType);
  }
  if (out.type === 'set' && out.elementType) {
    out.elementType = simplifyType(out.elementType);
  }
  if (out.type === 'promise' && out.elementType) {
    out.elementType = simplifyType(out.elementType);
  }
  if (out.type === 'class' && out.elementType) {
    out.elementType = simplifyType(out.elementType);
  }
  if (out.type === 'tuple' && out.elements) {
    out.elements = out.elements.map(simplifyType);
  }
  if (out.type === 'tupleMember' && out.elementType) {
    out.elementType = simplifyType(out.elementType);
  }
  if (out.type === 'reference' && Array.isArray(out.args)) {
    out.args = out.args.map(simplifyType);
  }
  if (out.type === 'record' && out.key) {
    out.key = simplifyType(out.key);
  }
  if (out.type === 'map' && out.key) {
    out.key = simplifyType(out.key);
  }
  if (out.type === 'record' && out.val) {
    out.val = simplifyType(out.val);
  }
  if (out.type === 'map' && out.val) {
    out.val = simplifyType(out.val);
  }
  if (out.type === 'keyof' && out.argument) {
    out.argument = simplifyType(out.argument);
  }
  if (out.type === 'typeof' && out.argument) {
    out.argument = simplifyType(out.argument);
  }
  if (out.type === 'indexedAccess') {
    if (out.index) {
      out.index = simplifyType(out.index);
    }
    if (out.object) {
      out.object = simplifyType(out.object);
    }
  }
  if (out.type === 'condition') {
    if (out.checkType) {
      out.checkType = simplifyType(out.checkType);
    }
    if (out.extendsType) {
      out.extendsType = simplifyType(out.extendsType);
    }
    if (out.trueType) {
      out.trueType = simplifyType(out.trueType);
    }
    if (out.falseType) {
      out.falseType = simplifyType(out.falseType);
    }
  }
  if (out.type === 'rest' && out.annotation) {
    out.annotation = simplifyType(out.annotation);
  }
  if (out.type === 'templateLiteral' && out.types) {
    out.types = out.types.map(simplifyType);
  }
  if (out.type === 'function' && Array.isArray(out.parameters)) {
    out.parameters = out.parameters.map(simplifyType);
  }
  if (out.type === 'new' && Array.isArray(out.parameters)) {
    out.parameters = out.parameters.map(simplifyType);
  }
  if (out.type === 'new' && out.ret) {
    out.ret = simplifyType(out.ret);
  }
  if (out.type === 'parameter') {
    if (out.paramType) {
      out.paramType = simplifyType(out.paramType);
    }
    if (out.name && typeof out.name === 'object') {
      out.name = simplifyType(out.name);
    }
  }
  if (out.type === 'atom' && out.atomType && typeof out.atomType === 'object') {
    out.atomType = simplifyType(out.atomType);
  }
  if (out.type === 'indexSignature' && out.indexType) {
    out.indexType = simplifyType(out.indexType);
  }
  if (out.type === 'indexSignature' && Array.isArray(out.indexParameters)) {
    out.indexParameters = out.indexParameters.map(simplifyType);
  }
  if (out.type === 'mapping') {
    if (out.iterable) {
      out.iterable = simplifyType(out.iterable);
    }
    if (out.result) {
      out.result = simplifyType(out.result);
    }
    if (out.nameType) {
      out.nameType = simplifyType(out.nameType);
    }
  }
  return out;
}
export {simplifyType};
