import {isPureKeyExpression} from './isPureKeyExpression.js';
// Plain reads qualify: re-evaluating them changes nothing observable.
function testPureReadsPass() {
  const identifier = isPureKeyExpression({
    type: 'Identifier',
    name: 'k',
  });
  const member = isPureKeyExpression({
    type: 'MemberExpression',
    computed: false,
    object: {
      type: 'Identifier',
      name: 'a',
    },
    property: {
      type: 'Identifier',
      name: 'b',
    },
  });
  const literal = isPureKeyExpression({
    type: 'StringLiteral',
    value: 'k',
  });
  const allPure = identifier && member && literal;
  return allPure;
}
// Calls, updates and assignments may run user code, so they read impure
// and the emitter skips them instead of evaluating them twice.
function testImpureReadsFail() {
  const call = isPureKeyExpression({
    type: 'CallExpression',
    callee: {
      type: 'Identifier',
    },
  });
  const update = isPureKeyExpression({
    type: 'UpdateExpression',
    argument: {
      type: 'Identifier',
    },
  });
  const assign = isPureKeyExpression({
    type: 'AssignmentExpression',
  });
  const nonePure = !call && !update && !assign;
  return nonePure;
}
// Missing nodes read impure without throwing.
function testMissingFails() {
  const fromUndefined = isPureKeyExpression(undefined) === false;
  const fromNull = isPureKeyExpression(null) === false;
  const neither = fromUndefined && fromNull;
  return neither;
}
export const tests = [
  testPureReadsPass,
  testImpureReadsFail,
  testMissingFails,
];
