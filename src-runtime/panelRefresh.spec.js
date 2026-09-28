import {refreshWarning} from './TypePanel.js';
/**
 * @returns {object} Writable stub standing in for a Warning row.
 */
function stubWarning() {
  return {hits: 0, value: undefined, expect: undefined, msg: '', detailStrings: []};
}
function testFirstHitSetsAll() {
  const warnObj = stubWarning();
  refreshWarning(warnObj, {value: 'x', expect: 'string[]', msg: 'm1', strings: ['s1']});
  return warnObj.value === 'x' && warnObj.expect === 'string[]' &&
    warnObj.msg === 'm1' && warnObj.detailStrings.join() === 's1';
}
function testSecondHitRefreshesExpect() {
  // Regression: rows are keyed by loc-name across calls, so a second call
  // failing with a re-substituted type must replace the first call's
  // expect — otherwise the modal explains value #2 with type #1.
  const warnObj = stubWarning();
  refreshWarning(warnObj, {
    value: 'Single Error',
    expect: {type: 'condition', checkType: true, extendsType: true, trueType: 'string[]', falseType: 'string'},
    msg: 'm1',
    strings: ['s1'],
  });
  refreshWarning(warnObj, {
    value: ['Error 1'],
    expect: {type: 'condition', checkType: false, extendsType: true, trueType: 'string[]', falseType: 'string'},
    msg: 'm2',
    strings: ['s2'],
  });
  return warnObj.value.join() === 'Error 1' && warnObj.expect.checkType === false &&
    warnObj.msg === 'm2' && warnObj.detailStrings.join() === 's2';
}
function testStringsCopied() {
  const warnObj = stubWarning();
  const strings = ['a'];
  refreshWarning(warnObj, {value: 1, expect: 'number', msg: 'm', strings});
  strings.push('mutated');
  return warnObj.detailStrings.length === 1;
}
const tests = [
  testFirstHitSetsAll,
  testSecondHitRefreshesExpect,
  testStringsCopied,
];
export {tests};
