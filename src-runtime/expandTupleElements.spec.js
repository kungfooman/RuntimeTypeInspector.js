import {expandTupleElements} from './expandTupleElements.js';
// We want: the input array and its elements to come back untouched, so
// shared registry tuples pass through expansion without being rewritten.
function testLeavesInputAlone() {
  const spread = {type: 'rest', annotation: {type: 'tuple', elements: ['number']}};
  const elements = ['string', spread];
  const {expanded, variadic, variadicPos, error} = expandTupleElements(elements);
  return elements.length === 2 && elements[0] === 'string' && elements[1] === spread &&
    expanded.length === 2 && expanded[0] === 'string' && expanded[1] === 'number' &&
    variadic === null && variadicPos === -1 && error === undefined;
}
// We want: tuple spreads to splice, array annotations to become the single
// variadic with its position, and named `...b: T[]` members to convert.
function testDesugaring() {
  const named = {type: 'tupleMember', elementType: {type: 'array', elementType: 'string'}, dotDot: true};
  const {expanded, variadic, variadicPos, error} = expandTupleElements(['boolean', named]);
  return expanded.length === 1 && expanded[0] === 'boolean' &&
    variadic && variadic.type === 'array' && variadic.elementType === 'string' &&
    variadicPos === 1 && error === undefined;
}
// We want: two variadics to report an error instead of silently keeping one,
// so validation can reject the ambiguous shape.
function testMultipleVariadicsError() {
  const rest = () => ({type: 'rest', annotation: {type: 'array', elementType: 'number'}});
  const {error} = expandTupleElements([rest(), rest()]);
  return error === 'multiple-variadic';
}
const tests = [
  testLeavesInputAlone,
  testDesugaring,
  testMultipleVariadicsError,
];
export {tests};
