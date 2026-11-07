/**
 * Erases suppressed parameters from one overload tuple in place.
 * @param {*} tuple - Positional parameter tuple for one overload.
 * @param {object} fnNode - Function node carrying declared parameters.
 * @param {Set<string>} ignored - Parameter names suppressed by the host.
 * @returns {*} The same tuple with suppressed members erased.
 * @example
 * import {parse} from '@babel/parser';
 * const ast = parse('function f(value) { return value; }');
 * const fnNode = ast.program.body[0];
 * eraseIgnoredOverloadParams({elements: []}, fnNode, new Set()); // {elements: []}
 */
function eraseIgnoredOverloadParams(tuple, fnNode, ignored) {
  const elements = tuple.elements;
  const params = fnNode.params;
  for (const [index, param] of params.entries()) {
    let target = param;
    if (target.type === 'AssignmentPattern') {
      target = target.left;
    }
    if (target.type === 'RestElement') {
      target = target.argument;
    }
    const member = elements[index];
    const isNamed = target.type === 'Identifier' && ignored.has(target.name);
    if (isNamed === false || !member) {
      continue;
    }
    member.elementType = member.dotDot ? {type: 'array', elementType: 'any'} : 'any';
  }
  return tuple;
}
export {eraseIgnoredOverloadParams};
