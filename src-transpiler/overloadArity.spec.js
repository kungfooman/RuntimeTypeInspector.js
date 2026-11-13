import {parse        } from '@babel/parser';
import {parserOptions} from './parserOptions.js';
import {overloadArity} from './overloadArity.js';
// An undocumented arrow needs no dummy parameters.
function testPlainArrowIsZero() {
  const src = '(value) => value';
  const ast = parse(src, parserOptions);
  const arrow = ast.program.body[0].expression;
  const parents = [ast.program, arrow];
  return overloadArity(arrow, parents) === 0;
}
// An overload arrow needs one dummy per required parameter.
function testOverloadCountsRequired() {
  const src = '/** @overload @param {number} first @param {number} [second] */ const f = (first, second = 1) => first;';
  const ast = parse(src, parserOptions);
  const [declaration] = ast.program.body;
  const [declarator] = declaration.declarations;
  const arrow = declarator.init;
  const parents = [ast.program, declaration, declarator, arrow];
  return overloadArity(arrow, parents) === 1;
}
export const tests = [testPlainArrowIsZero, testOverloadCountsRequired];
