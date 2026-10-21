import '../validateType.js';
import {scanMapEntries} from './scanMapEntries.js';
function scan(map, key, val) {
  const messages = [];
  const good = scanMapEntries(map, key, val, 'TestSite#method', 'mapProperty', true, (msg) => {
    messages.push(msg);
  }, 0);
  return {good, messages};
}
function testCleanScanPasses() {
  // A clean map scans true and warns nothing: the scan reports the
  // verdict and writes nothing anywhere.
  const {good, messages} = scan(new Map([[1, 'a']]), 'number', 'string');
  return good === true && messages.length === 0;
}
function testDirtyScanWarns() {
  // A wrong-typed value fails the scan and warns with the offending
  // entry path, so the caller can attribute the failure.
  const {good, messages} = scan(new Map([[1, 2]]), 'number', 'string');
  return good === false && messages.some((_) => _.includes('mapProperty.get(1)'));
}
function testUncheckedSidesSkipped() {
  // Undefined key or val means unchecked: anything passes those sides.
  const {good} = scan(new Map([['a', 1]]), undefined, undefined);
  return good === true;
}
const tests = [
  testCleanScanPasses,
  testDirtyScanWarns,
  testUncheckedSidesSkipped,
];
export {tests};
