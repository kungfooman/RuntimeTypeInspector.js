import {isPureKeyExpression} from './isPureKeyExpression.js';
/** @typedef {import('@babel/types').Node} Node */
/**
 * Reports whether an object literal needs spread-style tolerance: any
 * spread element, or any computed key whose expression is impure. Both
 * shapes carry keys the source never wrote literally, so the validator
 * must forgive every key the written list does not name. Pure computed
 * keys and plain keys need nothing: their names are statically known.
 * @param {Node} node - Babel object expression node.
 * @returns {boolean} True for spreads and impure computed keys.
 * @example
 * needsTolerance({
 *   type: 'ObjectExpression',
 *   properties: [{type: 'SpreadElement', argument: {type: 'Identifier'}}],
 * }); // true
 * @example
 * needsTolerance({
 *   type: 'ObjectExpression',
 *   properties: [{type: 'ObjectProperty', computed: false, key: {type: 'Identifier'}}],
 * }); // false: plain keys are statically known
 */
function needsTolerance(node) {
  return node.properties.some((property) => {
    if (property?.type === 'SpreadElement') {
      return true;
    }
    if (property?.computed === true && property.key) {
      return !isPureKeyExpression(property.key);
    }
    return false;
  });
}
export {needsTolerance};
