import {freshName} from './freshName.js';

/**
 * Names the parameter-local carrier of a computed property key.
 * @param {object} node - Property node to scan for collisions.
 * @returns {string} Identifier for the coerced key.
 * @example
 * import {parse} from '@babel/parser';
 * const ast = parse('const holder = {[key]: (value) => value};');
 * const property = ast.program.body[0].declarations[0].init.properties[0];
 * freshKeyName(property); // 'rtiOverloadKey'
 */
function freshKeyName(node) {
  return freshName(JSON.stringify(node), 'rtiOverloadKey');
}
export {freshKeyName};
