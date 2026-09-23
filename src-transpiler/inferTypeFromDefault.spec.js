import {parse} from '@babel/parser';
import {parserOptions} from './parserOptions.js';
import {inferTypeFromDefault} from './inferTypeFromDefault.js';
/**
 * @param {string} code - A default value expression.
 * @returns {import('@babel/types').Node} The parsed default value node.
 */
function defaultOf(code) {
  const ast = parse(`function f(x = ${code}) {}`, parserOptions);
  return ast.program.body[0].params[0].right;
}
function testWidenedLiterals() {
  if (inferTypeFromDefault(defaultOf('0')) !== 'number') {
    return false;
  }
  if (inferTypeFromDefault(defaultOf("'hi'")) !== 'string') {
    return false;
  }
  if (inferTypeFromDefault(defaultOf('true')) !== 'boolean') {
    return false;
  }
  return true;
}
function testNullishSkipped() {
  // null/undefined widen to any, which carries no check, so skip like today.
  if (inferTypeFromDefault(defaultOf('null')) !== undefined) {
    return false;
  }
  if (inferTypeFromDefault(defaultOf('undefined')) !== undefined) {
    return false;
  }
  return true;
}
function testContainers() {
  if (JSON.stringify(inferTypeFromDefault(defaultOf('[]'))) !== JSON.stringify({type: 'array', elementType: 'any'})) {
    return false;
  }
  if (JSON.stringify(inferTypeFromDefault(defaultOf('{}'))) !== JSON.stringify({type: 'object', properties: {}})) {
    return false;
  }
  return true;
}
function testUnaryAndSpecial() {
  if (inferTypeFromDefault(defaultOf('-1')) !== 'number') {
    return false;
  }
  if (inferTypeFromDefault(defaultOf('!x')) !== 'boolean') {
    return false;
  }
  if (JSON.stringify(inferTypeFromDefault(defaultOf('123n'))) !== JSON.stringify({type: 'bigint'})) {
    return false;
  }
  if (inferTypeFromDefault(defaultOf('/re/')) !== 'RegExp') {
    return false;
  }
  if (inferTypeFromDefault(defaultOf('`hi`')) !== 'string') {
    return false;
  }
  return true;
}
function testNewExpression() {
  if (inferTypeFromDefault(defaultOf('new Service()')) !== 'Service') {
    return false;
  }
  return true;
}
function testUninferableSkipped() {
  for (const code of ['foo', 'foo()', 'a.b', 'a ? b : c', 'x + 1']) {
    if (inferTypeFromDefault(defaultOf(code)) !== undefined) {
      return false;
    }
  }
  return true;
}
export const tests = [
  testWidenedLiterals,
  testNullishSkipped,
  testContainers,
  testUnaryAndSpecial,
  testNewExpression,
  testUninferableSkipped,
];
