import {isElementValue} from './isElementValue.js';
// We want: the fake DOM stand-ins to pass, because the panel specs run in
// Node where `instanceof Element` cannot hold. A `closest` function plus a
// string tag is the contract the panel call sites rely on.
function testFakeElementPasses() {
  const fake = {
    tag: 'div',
    closest() {
      return null;
    },
  };
  return isElementValue(fake) === true;
}
// We want: real elements from this realm to pass, because `instanceof`
// narrowing must keep holding where the constructor exists.
function testRealElementPasses() {
  if (typeof document === 'undefined' || typeof Element === 'undefined') {
    return true;
  }
  return isElementValue(document.createElement('div')) === true;
}
// We want: text-like nodes to fail, because double-click and drag guards
// must bail before reading `tagName` or calling `closest`.
function testNonElementsRejected() {
  const tagOnly = {
    tagName: 'DIV',
  };
  const badClosest = {
    closest: 'nope',
    tagName: 'DIV',
  };
  return (
    isElementValue(null) === false &&
    isElementValue(undefined) === false &&
    isElementValue('div') === false &&
    isElementValue(tagOnly) === false &&
    isElementValue(badClosest) === false
  );
}
// We want: getters that throw to fail closed, because host objects may
// raise on any property read.
function testThrowingGetterRejected() {
  const hostile = {
    get closest() {
      throw new Error('nope');
    },
    get tagName() {
      return 'DIV';
    },
  };
  return isElementValue(hostile) === false;
}
// We want: the predicate to narrow, because call sites read `tagName` and
// call `closest` after the guard with no cast.
function testPredicateNarrowsTag() {
  /**
   * @param {unknown} target - Event target to classify.
   * @returns {string|null} Lowercased tag, or null for non-elements.
   */
  function tagOf(target) {
    if (!isElementValue(target)) {
      return null;
    }
    return target.tagName.toLowerCase();
  }
  const fake = {
    tagName: 'DIV',
    closest() {
      return null;
    },
  };
  return tagOf(fake) === 'div' && tagOf('nope') === null;
}
const tests = [
  testFakeElementPasses,
  testRealElementPasses,
  testNonElementsRejected,
  testThrowingGetterRejected,
  testPredicateNarrowsTag,
];
export {tests};
