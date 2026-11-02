import {parseJSDoc} from './parseJSDoc.js';
import {expandTypeDepFree} from './expandTypeDepFree.js';

/**
 * Parses the implementation documentation of an overload group.
 * @param {string|null} impl - Implementation documentation section.
 * @param {object} options - Type parser for the implementation docs.
 * @returns {*} Parsed implementation parameters, if present.
 * @example
 * overloadImplParams(null, {}); // undefined
 */
function overloadImplParams(impl, options = {}) {
  const parser = options.expandType || expandTypeDepFree;
  if (!impl) return undefined;
  return parseJSDoc(impl, parser);
}
export {overloadImplParams};
