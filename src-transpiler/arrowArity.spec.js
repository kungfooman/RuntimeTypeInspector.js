import {parse     } from '@babel/parser';
import {arrowArity} from './arrowArity.js';
// Destructured parameters count, but a default ends the function length.
function testDestructuringBeforeDefault() {
  const src = '({x}, [y], z = 0, ...rest) => x';
  const ast = parse(src);
  const arrow = ast.program.body[0].expression;
  return arrowArity(arrow) === 2;
}
// A rest parameter itself does not contribute to function length.
function testRestStopsCount() {
  const src = '(first, ...rest) => first';
  const ast = parse(src);
  const arrow = ast.program.body[0].expression;
  return arrowArity(arrow) === 1;
}
export const tests = [testDestructuringBeforeDefault, testRestStopsCount];
