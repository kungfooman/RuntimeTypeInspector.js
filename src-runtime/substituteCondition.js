import {recurseSubstitute} from "./substitutes.js";
/**
 * Substitutes a conditional type, touching its check, extends, true, and
 * false branches.
 * @param {*} type - The conditional type.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {*} Substituted conditional type or the original.
 * @example
 * substituteCondition({type: 'condition', checkType: 'K', extendsType: 'string', trueType: 'number', falseType: 'boolean'}, 'K', '"a"', console.warn);
 * // {type: 'condition', checkType: '"a"', extendsType: 'string', trueType: 'number', falseType: 'boolean'}
 */
function substituteCondition(type, search, replace, warn) {
  const checkType = recurseSubstitute(type.checkType, search, replace, warn);
  const extendsType = recurseSubstitute(type.extendsType, search, replace, warn);
  const trueType = recurseSubstitute(type.trueType, search, replace, warn);
  const falseType = recurseSubstitute(type.falseType, search, replace, warn);
  if (checkType === type.checkType && extendsType === type.extendsType &&
    trueType === type.trueType && falseType === type.falseType) {
    return type;
  }
  return {...type, checkType, extendsType, trueType, falseType};
}
export {substituteCondition};
