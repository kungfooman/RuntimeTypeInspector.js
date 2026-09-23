import {expandTypeDepFree} from './expandTypeDepFree.js';
import {parseInlineParamType} from './parseInlineParamType.js';
function testExtractsSimpleType() {
  const comments = [{value: '* @type {number} '}];
  if (parseInlineParamType(comments, expandTypeDepFree) !== 'number') {
    return false;
  }
  return true;
}
function testNestedBraces() {
  const comments = [{value: '* @type {{a: number}} '}];
  const type = parseInlineParamType(comments, expandTypeDepFree);
  if (JSON.stringify(type) !== JSON.stringify({type: 'object', properties: {a: 'number'}})) {
    return false;
  }
  return true;
}
function testNoAtType() {
  if (parseInlineParamType([{value: ' just a comment '}], expandTypeDepFree) !== undefined) {
    return false;
  }
  if (parseInlineParamType(undefined, expandTypeDepFree) !== undefined) {
    return false;
  }
  return true;
}
function testLastWins() {
  const comments = [{value: '* @type {string} '}, {value: '* @type {number} '}];
  if (parseInlineParamType(comments, expandTypeDepFree) !== 'number') {
    return false;
  }
  return true;
}
export const tests = [
  testExtractsSimpleType,
  testNestedBraces,
  testNoAtType,
  testLastWins,
];
