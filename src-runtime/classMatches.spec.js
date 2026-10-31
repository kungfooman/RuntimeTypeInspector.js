import {registerClass, classes} from './registerClass.js';
import {classMatches} from './classMatches.js';
class MatchBase {}
class MatchChild extends MatchBase {}
class MatchOther {}
function prepare() {
  registerClass(MatchBase);
  registerClass(MatchChild);
  registerClass(MatchOther);
}
function unprepare() {
  delete classes.MatchBase;
  delete classes.MatchChild;
  delete classes.MatchOther;
}
// Exact tags match; subclass tags satisfy the parent through the
// registered chain; anything else (strangers, unknowns, untagged)
// declines so structural diffing keeps the row.
function testExactAndSubclassMatch() {
  prepare();
  try {
    const exact = classMatches('MatchBase', 'MatchBase') === true;
    const sub = classMatches('MatchChild', 'MatchBase') === true;
    const stranger = classMatches('MatchOther', 'MatchBase') === false;
    const unknown = classMatches('MatchBase', 'NeverHeard') === false;
    const untagged = classMatches(undefined, 'MatchBase') === false;
    return exact && sub && stranger && unknown && untagged;
  } finally {
    unprepare();
  }
}
export const tests = [
  testExactAndSubclassMatch,
];
