import {typedefs} from "./registerTypedef.js";
import {resolveTemplateLiteralValues} from "./resolveTemplateLiteralValues.js";
import {templateCandidates, recurseCandidates} from "./templateCandidates.js";
/**
 * Populates the dispatch table: every edge points outward from here, so the
 * module graph stays acyclic. Importing this module (or the package index)
 * guarantees a full table. The table stays writable on purpose: overriding
 * entries from userland (e.g. candidate enumeration for a custom
 * interpolation kind) takes effect immediately, without forking RTI or
 * waiting for a release. Keys mirror the export names.
 */
Object.assign(templateCandidates, {
  resolveTemplateLiteralCandidates,
  resolveTemplateLiteralValues,
});
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
 * @example
 * resolveTemplateLiteralCandidates('"en"', console.warn); // ['en']
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
      return recurseCandidates(typedefs[expect], warn, depth + 1);
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
        const candidates = recurseCandidates(member, warn, depth + 1);
        if (!candidates) {
          return;
        }
        out.push(...candidates);
      }
      return out;
    }
    case 'templateLiteral':
      return templateCandidates.resolveTemplateLiteralValues(expect, warn, depth + 1);
    default:
      warn(`validateTemplateLiteral: Cannot enumerate type '${expect.type}'.`);
  }
}
export {resolveTemplateLiteralCandidates};
