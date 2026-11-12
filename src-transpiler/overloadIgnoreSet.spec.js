import {overloadIgnoreSet} from './overloadIgnoreSet.js';
// A missing comment carries no suppression.
function testMissingCommentHasNoIgnore() {
  return overloadIgnoreSet(null) === null;
}
// A bare marker suppresses the whole check.
function testBareMarkerSuppressesAll() {
  return overloadIgnoreSet('@ignoreRTI') === 'all';
}
export const tests = [testMissingCommentHasNoIgnore, testBareMarkerSuppressesAll];
