import {parse} from '@babel/parser';
import {parserOptions} from './parserOptions.js';
import {isValidKey} from './isValidKey.js';
function testPlainPasses() {
  // Plain identifiers join dotted names raw.
  return isValidKey('set') === true;
}
function testDashFails() {
  // Dashes need bracket quoting in display names.
  return isValidKey('a-b') === false;
}
function testEmptyFails() {
  // Empty keys never render raw.
  return isValidKey('') === false;
}
function testUnicodeFails() {
  // Non-ASCII keys quote, even when valid in source.
  return isValidKey('caf\u00e9') === false;
}
export const tests = [
  testPlainPasses,
  testDashFails,
  testEmptyFails,
  testUnicodeFails,
];
