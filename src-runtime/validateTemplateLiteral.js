import {typedefs} from "./registerTypedef.js";
/**
 * Enumerates all concrete string candidates of a template literal interpolation.
 *
 * Supported inputs:
 *  - string literal types, e.g. `"en"` or `'en'`
 *  - unions of the above
 *  - references to registered typedefs (resolved recursively)
 *  - number/boolean literals
 *  - nested template literals
 *
 * @param {import('./validateType.js').Type} expect - The type to enumerate.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} [depth] - The depth to detect recursion.
 * @returns {string[]|undefined} All possible strings or `undefined` if not enumerable.
 */
function resolveTemplateLiteralCandidates(expect, warn, depth = 0) {
  if (depth > 16) {
    warn('validateTemplateLiteral: Exceeded recursive depth limit.');
    return;
  }
  if (typeof expect === 'number' || typeof expect === 'boolean') {
    return [String(expect)];
  }
  if (typeof expect === 'string') {
    if (typedefs[expect]) {
      return resolveTemplateLiteralCandidates(typedefs[expect], warn, depth + 1);
    }
    if (expect[0] === '"' && expect[expect.length - 1] === '"') {
      return [expect.slice(1, -1)];
    }
    if (expect[0] === "'" && expect[expect.length - 1] === "'") {
      return [expect.slice(1, -1)];
    }
    warn(`validateTemplateLiteral: Cannot enumerate '${expect}'.`);
    return;
  }
  if (!expect || typeof expect !== 'object') {
    warn('validateTemplateLiteral: Cannot enumerate template part.', expect);
    return;
  }
  switch (expect.type) {
    case 'union': {
      /** @type {string[]} */
      const out = [];
      for (const member of expect.members) {
        const candidates = resolveTemplateLiteralCandidates(member, warn, depth + 1);
        if (!candidates) {
          return;
        }
        out.push(...candidates);
      }
      return out;
    }
    case 'templateLiteral':
      return templateLiteralValues(expect, warn, depth + 1);
    default:
      warn(`validateTemplateLiteral: Cannot enumerate type '${expect.type}'.`);
  }
}
/**
 * Computes all concrete strings a structured `templateLiteral` type can produce.
 * @param {object} expect - The structured `templateLiteral` type.
 * @param {string[]} expect.quasis - The literal chunks.
 * @param {import('./validateType.js').Type[]} expect.types - The interpolated types.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} [depth] - The depth to detect recursion.
 * @returns {string[]|undefined} All possible strings or `undefined` if not enumerable.
 */
function templateLiteralValues(expect, warn, depth = 0) {
  const {quasis, types} = expect;
  /** @type {string[]} */
  let values = [quasis[0]];
  for (let i = 0; i < types.length; i++) {
    const candidates = resolveTemplateLiteralCandidates(types[i], warn, depth);
    if (!candidates) {
      return;
    }
    /** @type {string[]} */
    const next = [];
    for (const prefix of values) {
      for (const candidate of candidates) {
        next.push(prefix + candidate + quasis[i + 1]);
      }
    }
    values = next;
  }
  return values;
}
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {object} expect - The supposed type information of said value.
 * @param {string[]} expect.quasis - The literal chunks.
 * @param {import('./validateType.js').Type[]} expect.types - The interpolated types.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @param {console["warn"]} warn - Function to warn with.
 * @param {number} depth - The depth to detect recursion.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function validateTemplateLiteral(value, expect, loc, name, critical, warn, depth) {
  const values = templateLiteralValues(expect, warn);
  if (!values) {
    warn(`Given value '${value}' couldn't be checked against template literal type.`, {loc, name, expect});
    return false;
  }
  if (values.includes(value)) {
    return true;
  }
  warn(`Given value '${value}' doesn't satisfy template literal type.`, {loc, name, expect, values});
  return false;
}
export {validateTemplateLiteral, templateLiteralValues, resolveTemplateLiteralCandidates};
