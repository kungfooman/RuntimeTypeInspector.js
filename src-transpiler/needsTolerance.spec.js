import {needsTolerance} from './needsTolerance.js';
// Spreads need tolerance: their keys are never written literally.
function testSpreadNeedsTolerance() {
  const spread = {
    type: 'ObjectExpression',
    properties: [
      {
        type: 'SpreadElement',
        argument: {
          type: 'Identifier',
        },
      },
    ],
  };
  const wanted = needsTolerance(spread) === true;
  return wanted;
}
// Plain and pure-computed keys are statically known, so they need nothing.
function testPlainKeysNeedNothing() {
  const plain = needsTolerance({
    type: 'ObjectExpression',
    properties: [
      {
        type: 'ObjectProperty',
        computed: false,
        key: {
          type: 'Identifier',
        },
      },
    ],
  });
  const pure = needsTolerance({
    type: 'ObjectExpression',
    properties: [
      {
        type: 'ObjectProperty',
        computed: true,
        key: {
          type: 'Identifier',
        },
      },
    ],
  });
  const neither = plain === false && pure === false;
  return neither;
}
// Impure computed keys need tolerance: re-reading them would run user
// code twice and record a name the literal never wrote.
function testImpureComputedNeedsTolerance() {
  const impure = {
    type: 'ObjectExpression',
    properties: [
      {
        type: 'ObjectProperty',
        computed: true,
        key: {
          type: 'CallExpression',
        },
      },
    ],
  };
  const wanted = needsTolerance(impure) === true;
  return wanted;
}
export const tests = [
  testSpreadNeedsTolerance,
  testPlainKeysNeedNothing,
  testImpureComputedNeedsTolerance,
];
