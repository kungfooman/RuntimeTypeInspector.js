/**
 * Names dummy leading parameters that preserve an overload arrow length.
 * @param {number} arity - Original required parameter count.
 * @param {string} base - Preferred identifier base.
 * @returns {string[]} One dummy name per required parameter.
 * @example
 * import {parse} from '@babel/parser';
 * const ast = parse('(first, second = 1) => first');
 * const arrow = ast.program.body[0].expression;
 * const params = arrow.params;
 * dummyArityNames(params.length, 'rtiParam'); // ['rtiParam0', 'rtiParam1']
 */
function dummyArityNames(arity, base) {
  const names = [];
  for (let index = 0; index < arity; index++) {
    names.push(base + index);
  }
  return names;
}
export {dummyArityNames};
