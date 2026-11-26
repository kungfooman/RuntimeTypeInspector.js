/** @typedef {import('@babel/types').Node} Node */
import {isPureKeyExpression} from './isPureKeyExpression.js';
/**
 * Builds one synthetic string-literal node carrying its source spelling,
 * so the Stringifier (which renders `extra.raw`) emits it verbatim.
 * @param {string} value - The key name.
 * @returns {Node} StringLiteral node with `extra.raw` set.
 * @example
 * keyLiteral('a').extra.raw; // '"a"'
 */
function keyLiteral(value) {
  return {
    type: 'StringLiteral',
    value,
    extra: {
      rawValue: value,
      raw: JSON.stringify(value),
    },
  };
}
/**
 * Builds the statically written key-name array for a spread-carrying object
 * literal. Plain identifiers and string or numeric literals contribute
 * their text; pure computed keys contribute their key expression so the
 * runtime reads the evaluated name. Impure computed keys (calls, updates,
 * assignments and the rest) are skipped: re-evaluating them would run user
 * code twice and record a name the literal never wrote. Object methods and
 * spreads contribute no name. Never throws: exotic keys fall back to an
 * empty array entry the validator ignores.
 * @param {Node} node - Babel object expression node.
 * @returns {Node} Array expression of key names and key expressions.
 * @example
 * ownWrittenKeys({
 *   type: 'ObjectExpression',
 *   properties: [{type: 'SpreadElement', argument: {type: 'Identifier'}}],
 * }); // {type: 'ArrayExpression', elements: []}
 */
function ownWrittenKeys(node) {
  const elements = [];
  for (const property of node?.properties ?? []) {
    if (property?.type === 'ObjectProperty') {
      const {key, computed} = property;
      if (!computed && key?.type === 'Identifier') {
        elements.push(keyLiteral(key.name));
        continue;
      }
      if (!computed && (key?.type === 'StringLiteral' || key?.type === 'NumericLiteral')) {
        elements.push(keyLiteral(String(key.value)));
        continue;
      }
      if (computed && key && isPureKeyExpression(key)) {
        elements.push(key);
      }
    } else if (property?.type === 'ObjectMethod') {
      const {key, computed} = property;
      if (!computed && key?.type === 'Identifier') {
        elements.push(keyLiteral(key.name));
      } else if (!computed && (key?.type === 'StringLiteral' || key?.type === 'NumericLiteral')) {
        elements.push(keyLiteral(String(key.value)));
      } else if (computed && key && isPureKeyExpression(key)) {
        elements.push(key);
      }
    }
  }
  const out = {
    type: 'ArrayExpression',
    elements,
  };
  if (node?.loc) {
    out.loc = node.loc;
  }
  return out;
}
export {keyLiteral, ownWrittenKeys};
