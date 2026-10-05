import {braceDepth} from './braceDepth.js';
function testEmptyIsZero() {
  // No text means no open braces.
  return braceDepth('') === 0;
}
function testBalancedIsZero() {
  // Matched pairs cancel out.
  return braceDepth('{a: {b: 1}}') === 0;
}
function testUnbalancedCountsOpen() {
  // Split-across-lines typedefs rejoin while the count stays positive.
  return braceDepth('{a: {b: 1}') === 1 && braceDepth('{{') === 2;
}
function testCloseOnlyGoesNegative() {
  // Stray closers drive the count negative, which terminates extraction.
  return braceDepth('}') === -1 && braceDepth('{}}') === -1;
}
function testNonBracesIgnored() {
  // Anything else never moves the count.
  return braceDepth('no braces here') === 0;
}
export const tests = [
  testEmptyIsZero,
  testBalancedIsZero,
  testUnbalancedCountsOpen,
  testCloseOnlyGoesNegative,
  testNonBracesIgnored,
];
