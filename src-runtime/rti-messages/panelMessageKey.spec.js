import {panelMessageKey} from './panelMessageKey.js';
function testLocalKeepsBareKey() {
  // Same runtime traffic (and legacy unstamped mail) keeps the bare key,
  // so the single registry page renders exactly like before.
  return (
    panelMessageKey('L1-a', 'abc', 'abc') === 'L1-a' &&
    panelMessageKey('L1-a', undefined, 'abc') === 'L1-a'
  );
}
function testForeignSuffixesSource() {
  // Foreign registries land under a suffixed key, so two registries never
  // merge one row or blend their failures silently.
  return panelMessageKey('L1-a', 'foreign', 'abc') === 'L1-a@foreign';
}
export const tests = [
  testLocalKeepsBareKey,
  testForeignSuffixesSource,
];
