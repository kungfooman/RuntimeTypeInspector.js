import {unionValidatorPass} from './unionValidatorPass.js';
// A passing member short-circuits to clean, however late it sits: the
// probe mirrors the validator, so any row would contradict the verdict.
function testPassingMemberCleans() {
  const probe = (value, member) => member === 'number';
  return unionValidatorPass('x', ['string', 'number'], probe) === true;
}
// When no member passes, the structural findings stand and the union
// keeps its row: the gate only converts would-be rows, never the reverse.
function testFailingMembersDecline() {
  const probe = () => false;
  return unionValidatorPass('x', ['string', 'number'], probe) === false &&
    unionValidatorPass('x', [], probe) === false;
}
export const tests = [
  testPassingMemberCleans,
  testFailingMembersDecline,
];
