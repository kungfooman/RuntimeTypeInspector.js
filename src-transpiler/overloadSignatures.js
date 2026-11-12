import {overloadToTuple} from './overloadToTuple.js';
import {parseJSDocDocument} from './jsdoc-parsing-depfree/parseJSDocDocument.js';
import {expandTypeDepFree} from './expandTypeDepFree.js';
import {eraseIgnoredOverloadParams} from './eraseIgnoredOverloadParams.js';
/**
 * Builds runtime overload signatures for one documented function.
 * Pre-marker templates scope every section (flat scope, matching tsc
 * where the tag parses outside every marker span): each section
 * inherits them under its own rows, which win on collision.
 * @param {string[]} overloads - Overload documentation sections.
 * @param {object} fnNode - Function node carrying declared parameters.
 * @param {object} options - Scope templates, ignore set, and type parser.
 * @returns {{tuple: *, templates: Record<string, *>}[]} Runtime signatures.
 * @example
 * overloadSignatures([], {params: []}, {}); // []
 */
function overloadSignatures(overloads, fnNode, options = {}) {
  const parser = options.expandType || expandTypeDepFree;
  const {scopeTemplates} = options;
  const {ignored} = options;
  const ignoreSet = ignored instanceof Set ? ignored : undefined;
  const hasPreMarker = options.preMarker !== undefined && options.preMarker !== '';
  const preTemplates = hasPreMarker ?
    parseJSDocDocument(options.preMarker, parser).templates :
    undefined;
  return overloads.map((section) => {
    const tuple = overloadToTuple(section, parser, ignoreSet);
    if (ignored instanceof Set) {
      eraseIgnoredOverloadParams(tuple, fnNode, ignored);
    }
    const {templates: own} = parseJSDocDocument(section, parser);
    const templates = {...preTemplates, ...scopeTemplates, ...own};
    return {tuple, templates};
  });
}
export {overloadSignatures};
