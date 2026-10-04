import {substitutes} from "./substitutes.js";
/**
 * Substitutes a template literal type, touching its interpolated types.
 * @param {*} type - The template literal type.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {*} Substituted template literal type or the original.
 * @example
 * substituteTemplateLiteral({type: 'templateLiteral', quasis: ['a', 'b'], types: ['K']}, 'K', '"x"', console.warn);
 * // {type: 'templateLiteral', quasis: ['a', 'b'], types: ['"x"']}
 */
function substituteTemplateLiteral(type, search, replace, warn) {
  const types = substitutes.substituteList(type.types, search, replace, warn);
  return types === type.types ? type : {...type, types};
}
export {substituteTemplateLiteral};
