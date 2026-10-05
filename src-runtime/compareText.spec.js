import {compareText} from './compareText.js';
function testCarriesMessageAndPanes() {
  // The copy keeps the message plus both panes, in order.
  const text = compareText({msg: 'loc> bad', expect: 'number', value: 's', name: 'x', hits: 2});
  const panes = text.indexOf('Expected:') < text.indexOf('Actual:');
  return text.startsWith('loc> bad\n') && panes && text.includes('Hits: 2');
}
function testMentionsMismatch() {
  // A type mismatch surfaces its finding row with path and expectation.
  const text = compareText({msg: 'm', expect: 'number', value: 's', name: 'x', hits: 1});
  return text.includes('Diagnosis:') && text.includes('expected number');
}
function testSurvivesOpaqueValue() {
  // Opaque shapes degrade to the fallback line instead of throwing.
  const circular = {};
  circular.self = circular;
  const text = compareText({msg: 'm', expect: 'number', value: circular, name: 'x', hits: 1});
  return typeof text === 'string' && text.includes('Diagnosis:');
}
export const tests = [
  testCarriesMessageAndPanes,
  testMentionsMismatch,
  testSurvivesOpaqueValue,
];
