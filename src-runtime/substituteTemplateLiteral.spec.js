import {substituteTemplateLiteral} from './substituteTemplateLiteral.js';
const noop = () => undefined;
// We want: the interpolated types of a template literal substitute, because
// each interpolation is a separate type position.
function testTemplateLiteralTypes() {
  const input = {type: 'templateLiteral', quasis: ['a', 'b'], types: ['K']};
  return JSON.stringify(substituteTemplateLiteral(input, 'K', '"x"', noop)) ===
    JSON.stringify({type: 'templateLiteral', quasis: ['a', 'b'], types: ['"x"']});
}
// We want: a template literal with no matching key is returned by identity,
// so unchanged subtrees keep their identity for downstream memos.
function testTemplateLiteralUnchanged() {
  const input = {type: 'templateLiteral', quasis: ['a', 'b'], types: ['string']};
  return substituteTemplateLiteral(input, 'K', '"x"', noop) === input;
}
// We want: multiple interpolations each substitute independently, because
// each is a separate type position.
function testTemplateLiteralMultiple() {
  const input = {type: 'templateLiteral', quasis: ['a', 'b', 'c'], types: ['K', 'K']};
  return JSON.stringify(substituteTemplateLiteral(input, 'K', '"x"', noop)) ===
    JSON.stringify({type: 'templateLiteral', quasis: ['a', 'b', 'c'], types: ['"x"', '"x"']});
}
const tests = [
  testTemplateLiteralTypes,
  testTemplateLiteralUnchanged,
  testTemplateLiteralMultiple,
];
export {tests};
