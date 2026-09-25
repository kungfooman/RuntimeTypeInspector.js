/**
 * Collects template inference candidates by walking a runtime value alongside
 * its UNSUBSTITUTED expected type. Only positions TypeScript itself infers
 * from yield candidates: bare occurrences, array/tuple elements, object
 * properties, index-signature values, record/map values, union/intersection
 * members, generic reference arguments and rest annotations. Positions that
 * defer or block inference yield nothing: `NoInfer<T>` subtrees, indexed
 * access, mappings, conditions, `keyof`/`typeof`, template literals and
 * function signatures (none of these can be reversed into a literal
 * candidate at runtime).
 * Only string/number/boolean literals ever become candidates; complex values
 * keep the declared constraint (fail-open, as before).
 * @param {*} value - The actual runtime value.
 * @param {*} expect - Unsubstituted expected type (template refs intact).
 * @param {{key: string, literal: string|number|boolean, value: *}[]} out - Collected candidates.
 * @returns {{key: string, literal: string|number|boolean, value: *}[]} The `out` array.
 */
function collectCandidates(value, expect, out = []) {
  if (typeof expect === 'string') {
    // Bare position (`T`, `string`, `"a"`): only unquoted names can be keys,
    // quoted strings and primitives are literals. Membership in `templates`
    // is checked by the caller, not here.
    if (expect.length >= 2 && (expect[0] === '"' && expect[expect.length - 1] === '"' ||
        expect[0] === "'" && expect[expect.length - 1] === "'")) {
      return out;
    }
    const literal = literalOf(value);
    if (literal !== undefined) {
      out.push({key: expect, literal, value});
    }
    return out;
  }
  if (expect === null || typeof expect !== 'object') {
    // Numeric/boolean literal expects carry no template refs.
    return out;
  }
  // Annotated atoms like `{type: 'T', optional: true}` (what annotateOptional
  // emits for `@param {T} [a]`): the inner name is the inference site.
  if (typeof expect.type === 'string' || typeof expect.type === 'number' || typeof expect.type === 'boolean') {
    const keys = Object.keys(expect);
    if (keys.every((key) => key === 'type' || key === 'optional' || key === 'readonly')) {
      return collectCandidates(value, expect.type, out);
    }
  }
  switch (expect.type) {
    case 'object': {
      if (value === null || typeof value !== 'object' || value instanceof Array) {
        return out;
      }
      const {properties} = expect;
      if (properties && typeof properties === 'object') {
        for (const prop in properties) {
          collectCandidates(value[prop], properties[prop], out);
        }
      }
      if (Array.isArray(expect.indexSignatures)) {
        for (const signature of expect.indexSignatures) {
          if (signature && signature.type === 'indexSignature' && signature.indexType !== undefined) {
            for (const key of Object.keys(value)) {
              collectCandidates(value[key], signature.indexType, out);
            }
          }
        }
      }
      return out;
    }
    case 'tuple': {
      if (!(value instanceof Array) || !Array.isArray(expect.elements)) {
        return out;
      }
      for (let i = 0; i < expect.elements.length; i++) {
        collectCandidates(value[i], unwrapMember(expect.elements[i]), out);
      }
      return out;
    }
    case 'array':
      if (value instanceof Array && expect.elementType !== undefined) {
        for (const element of value) {
          collectCandidates(element, expect.elementType, out);
        }
      }
      return out;
    case 'reference':
      // `NoInfer<T>` blocks inference from its whole subtree (mirrors the
      // validation passthrough in validateReference, which checks the shape
      // without contributing candidates).
      if (expect.name === 'NoInfer') {
        return out;
      }
      if (Array.isArray(expect.args)) {
        for (const arg of expect.args) {
          collectCandidates(value, arg, out);
        }
      }
      return out;
    case 'promise':
    case 'set':
    case 'class':
      if (expect.elementType !== undefined) {
        collectCandidates(value, expect.elementType, out);
      }
      return out;
    case 'union':
    case 'intersection':
      if (Array.isArray(expect.members)) {
        // Superset collection across constituents (fail-open): pinning only
        // ever happens for values that already validated, so constituents
        // the value didn't match can only add widened siblings.
        for (const member of expect.members) {
          collectCandidates(value, member, out);
        }
      }
      return out;
    case 'record':
    case 'map':
      // Values only: keys are not collected (Record-key inference is a known
      // gap, documented in inspectTypeWithTemplates).
      if (value !== null && typeof value === 'object' && expect.val !== undefined) {
        for (const key of Object.keys(value)) {
          collectCandidates(value[key], expect.val, out);
        }
      }
      return out;
    case 'rest':
      if (expect.annotation !== undefined) {
        collectCandidates(value, expect.annotation, out);
      }
      return out;
    case 'tupleMember':
      if (expect.elementType !== undefined) {
        collectCandidates(value, expect.elementType, out);
      }
      return out;
    case 'indexedAccess':
    case 'mapping':
    case 'condition':
    case 'keyof':
    case 'typeof':
    case 'templateLiteral':
    case 'function':
    case 'new':
    case 'indexSignature':
      // Deferred or non-reversible positions: never inference sites.
      return out;
    default:
      return out;
  }
}
/**
 * Unwraps tuple element decorations (`tupleMember`, `rest`) to the inner type.
 * @param {*} element - Raw tuple element.
 * @returns {*} Unwrapped type.
 */
function unwrapMember(element) {
  if (element && typeof element === 'object' && (element.type === 'tupleMember' || element.type === 'rest')) {
    return element.elementType ?? element.annotation;
  }
  return element;
}
/**
 * Narrows a runtime value to its literal type, e.g. `camera` becomes
 * `"camera"`. Only literals narrow: objects keep the declared constraint.
 * @param {*} value - The actual value that was validated.
 * @returns {string|number|boolean|undefined} Literal type or undefined.
 */
function literalOf(value) {
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
}
export {collectCandidates, literalOf};
