import {expandTypeDepFree} from "./expandTypeDepFree.js";
import {annotateOptional} from "./annotateOptional.js";
import {isUnionNode} from "./isUnionNode.js";
import {isArrayNode} from "./isArrayNode.js";
import {isObjectNode} from "./isObjectNode.js";
/** @import {ExpandedType} from './expandedType.js' */
/**
 * @typedef {ReturnType<typeof parseJSDoc>} ParseJSDocReturnType
 */
/**
 * @typedef {typeof expandTypeDepFree} ExpandType
 * @typedef {ReturnType<ExpandType>} ExpandTypeReturnType
 */
/**
 * Parses JSDoc comments to extract parameter type information.
 *
 * @param {string} src - The JSDoc comment string to parse.
 * @param {ExpandType} [expandType] - An optional function to process the types found in the JSDoc.
 * @returns {Record<string, ExpandTypeReturnType> | undefined} An object mapping parameter names to their parsed types, or undefined if no parameters are found.
 */
function parseJSDoc(src, expandType = expandTypeDepFree) {
  // Parse something like: @param {Object} [kwargs={}] Optional arguments.
  const regex = /@param \{(.*?)\} ([\[\]a-zA-Z0-9_$=\-\{\}\.'" ]+)/g;
  const matches = [...src.matchAll(regex)];
  /** @type {Record<string, ExpandTypeReturnType>} */
  const params = Object.create(null);
  matches.forEach((_) => {
    const rawType = expandType(_[1].trim());
    if (rawType === undefined) {
      console.warn(
        "parseJSDoc> Skipping @param, type is unrepresentable. Please check if your JSDoc is valid or open an issue about this!",
        {src, match: _[0]}
      );
      return;
    }
    let name = _[2].trim();
    let optional = false;
    // Examples:
    //   name: [kwargs={}] The configuration parameters.
    //   name: [d = 1.0] Sample spacing
    if (name[0] === '[') {
      // Counting opening/closing brackets for perfect match
      let openCloseCount = 1;
      let i = 1;
      for (; i<name.length; i++) {
        const c = name[i];
        if (c === '[') {
          openCloseCount++;
        } else if (c === ']') {
          openCloseCount--;
        }
        if (openCloseCount === 0) {
          break;
        }
      }
      // Afterwards name will be: d = 1.0
      name = name.substring(1, i);
      // mark it for the type:
      optional = true;
    }
    // Strip the rest (either leftover of optional value or description)
    name = name.split(' ')[0].split('=')[0].trim();
    const annotatedType = annotateOptional(rawType, optional);
    // Turn "options.stats[].unitsName" into ['options', 'stats', 'unitsName'].
    const parts = name.split(/[\[\]]*\./);
    /** @type {Record<string, ExpandedType | undefined>} */
    let properties = params;
    for (const part of parts) {
      const toptype = properties[part];
      if (toptype === undefined) {
        // No toptype means we resolved as far as possible, now we can add `annotatedType`.
        console.assert(part === parts.at(-1), 'Current part and last part should be the same.');
        properties[part] = annotatedType;
      } else if (isUnionNode(toptype)) {
        const typeObject = toptype.members.find(isObjectNode);
        if (typeObject === undefined || typeObject.properties === undefined) {
          console.warn(
            "parseJSDoc> Skipping @param, union has no object member to navigate into. Please check if your JSDoc is valid or open an issue about this!",
            {src, toptype, parts, annotatedType}
          );
        } else {
          properties = typeObject.properties;
        }
      } else if (isArrayNode(toptype)) {
        const elementType = toptype.elementType;
        if (!isObjectNode(elementType) || elementType.properties === undefined) {
          console.warn(
            "parseJSDoc> Skipping @param, array element has no properties to navigate into. Please check if your JSDoc is valid or open an issue about this!",
            {src, toptype, parts, annotatedType}
          );
        } else {
          properties = elementType.properties;
        }
      } else if (isObjectNode(toptype)) {
        toptype.properties = toptype.properties || Object.create(null);
        const props = toptype.properties;
        if (props !== undefined) {
          properties = props;
        }
      } else {
        console.warn(
          "parseJSDoc> Skipping @param, unseen syntax detected. Please check if your JSDoc is valid or open an issue about this!",
          {src, toptype, parts, annotatedType}
        );
      }
    }
  });
  if (Object.keys(params).length === 0) {
    return;
  }
  return params;
}
export {parseJSDoc};
