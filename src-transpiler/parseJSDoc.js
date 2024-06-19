import {expandTypeDepFree} from "./expandTypeDepFree.js";
import {simplifyType} from "./simplifyType.js";
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
  matches.forEach(_ => {
    const type = expandType(_[1].trim());
    let name = _[2].trim();
    let optional = false;
    // Examples:
    //   name: [kwargs={}] The configuration parameters.
    //   name: [d = 1.0] Sample spacing
    if (name[0] === '[') {
      // Possible improvement: counting opening/closing brackets for perfect match
      const closer = name.lastIndexOf(']');
      // Afterwards name will be: d = 1.0
      name = name.substring(1, closer);
      // mark it for the type:
      optional = true;
    }
    // Strip the rest (either leftover of optional value or description)
    name = name.split(' ')[0].split('=')[0].trim();
    const simplifiedType = simplifyType(type, optional);
    // Turn "options.stats[].unitsName" into ['options', 'stats', 'unitsName'].
    const parts = name.split(/[\[\]]*\./);
    let properties = params;
    for (const part of parts) {
      const toptype = properties[part];
      if (!toptype) {
        // No toptype means we resolved as far as possible, now we can add `simplifiedType`.
        console.assert(part === parts.at(-1), 'Current part and last part should be the same.');
        properties[part] = simplifiedType;
      } else if (toptype.type === "union") {
        const typeObject = toptype.members.find(_ => _?.type === 'object');
        properties = typeObject.properties;
      } else if (toptype.type === "array") {
        properties = toptype.elementType.properties;
      } else if (toptype.type === "object") {
        toptype.properties = toptype.properties || Object.create(null);
        properties = toptype.properties;
      } else {
        console.warn(
          "parseJSDoc> Skipping @param, unseen syntax detected. Please check if your JSDoc is valid or open an issue about this!",
          {src, toptype, parts, simplifiedType}
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
