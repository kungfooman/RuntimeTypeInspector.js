import './validateType.js';
import {scanAndSettle} from './scanAndSettle.js';
import {freshWindow} from './freshWindow.js';
import {options} from './options.js';
function scan(map, key, val) {
  const messages = [];
  const record = freshWindow();
  const good = scanAndSettle(map, record, key, val, 'TestSite#method', 'mapProperty', true, (msg) => {
    messages.push(msg);
  }, 0);
  return {good, record, messages};
}
function testCleanScanDoublesWindow() {
  // A clean scan doubles the interval from the fresh record, so repeated
  // checks of an unchanged map amortize while drift stays detectable.
  const virgin = options.mapCheckWindowCap;
  options.mapCheckWindowCap = 1024;
  try {
    const {good, record} = scan(new Map([[1, 'a']]), 'number', 'string');
    return good === true && record.window === 2 && record.sinceLast === 0 && record.lastSize === 1;
  } finally {
    options.mapCheckWindowCap = virgin;
  }
}
function testDirtyScanWarnsAndKeepsWindow() {
  // A wrong-typed value fails the scan, warns with the offending entry,
  // and leaves the window alone (the caller resets it, not the scan).
  const {good, record, messages} = scan(new Map([[1, 2]]), 'number', 'string');
  return good === false && record.window === 1 && record.lastSize === 1 &&
    messages.some((_) => _.includes('mapProperty.get(1)'));
}
function testUncheckedSidesSkipped() {
  // Undefined key or val means unchecked: anything passes those sides.
  const {good} = scan(new Map([['a', 1]]), undefined, undefined);
  return good === true;
}
const tests = [
  testCleanScanDoublesWindow,
  testDirtyScanWarnsAndKeepsWindow,
  testUncheckedSidesSkipped,
];
export {tests};
