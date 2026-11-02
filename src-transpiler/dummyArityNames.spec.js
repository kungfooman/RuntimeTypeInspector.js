import {parse} from '@babel/parser';
import {dummyArityNames} from './dummyArityNames.js';

// Dummy names count one leading parameter per required arity slot.
function testNamesCountArity() {
  const src = '(first, second = 1) => first';
  const ast = parse(src);
  const arrow = ast.program.body[0].expression;
  const params = arrow.params;
  const names = dummyArityNames(params.length, 'rtiParam');
  const firstName = names[0];
  const secondName = names[1];
  return (
    names.length === 2 &&
    firstName === 'rtiParam0' &&
    secondName === 'rtiParam1'
  );
}

export const tests = [testNamesCountArity];
