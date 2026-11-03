import {overloadToTuple} from './overloadToTuple.js';
import {parseJSDocTemplates} from './parseJSDocTemplates.js';
import {expandTypeDepFree} from './expandTypeDepFree.js';
import {eraseIgnoredOverloadParams} from './eraseIgnoredOverloadParams.js';

/**
 * Builds runtime overload signatures for one documented function.
 * @param {string[]} overloads - Overload documentation sections.
 * @param {object} fnNode - Function node carrying declared parameters.
 * @param {object} options - Scope templates, ignore set, and type parser.
 * @returns {{tuple: *, templates: Record<string, *>}[]} Runtime signatures.
 * @example
 * overloadSignatures([], {params: []}, {}); // []
 */
function overloadSignatures(overloads, fnNode, options = {}) {
  const parser = options.expandType || expandTypeDepFree;
  const scopeTemplates = options.scopeTemplates;
  const ignored = options.ignored;
  const ignoreSet = ignored instanceof Set ? ignored : undefined;
  return overloads.map((section) => {
    const tuple = overloadToTuple(section, parser, ignoreSet);
    if (ignored instanceof Set) eraseIgnoredOverloadParams(tuple, fnNode, ignored);
    const own = parseJSDocTemplates(section, parser);
    const templates = {...scopeTemplates, ...own};
    return {tuple, templates};
  });
}
export {overloadSignatures};
