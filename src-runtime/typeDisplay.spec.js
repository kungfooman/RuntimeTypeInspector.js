import {describeValueType, prettyValue} from './describeValue.js';
import {formatCompare} from './humanizeExpect.js';
import {snip} from './explainMismatch.js';
import {stringifyValue} from './stringifyValue.js';
import {inspectType} from './inspectType.js';
import {captureMessages, dump, warningFor} from '../src-unittest/index.js';
function testDescribeTypedArrays() {
  return describeValueType(new Uint8Array([1, 2, 3])) === 'Uint8Array(3) [1, 2, 3]' &&
    describeValueType(new Int32Array([1, 2, 3])) === 'Int32Array(3) [1, 2, 3]' &&
    describeValueType(new Float64Array([1.5])) === 'Float64Array(1) [1.5]' &&
    describeValueType(new BigInt64Array([1n, 2n])) === 'BigInt64Array(2) [1n, 2n]' &&
    describeValueType(new Uint8Array(0)) === 'Uint8Array(0) []' &&
    describeValueType(Buffer.from([1, 2, 3])) === 'Buffer(3) [1, 2, 3]';
}
function testDescribeTypedArrayBounded() {
  const text = describeValueType(new Uint8Array(Array.from({length: 30}, (_, i) => i)));
  return text.startsWith('Uint8Array(30) [0, 1, 2') && text.endsWith(', ...]') && !text.includes('29');
}
function testDescribeTypedArrayDepthZero() {
  return describeValueType(new Uint8Array([1, 2, 3]), 0) === 'Uint8Array';
}
function testDescribeBuffers() {
  return describeValueType(new DataView(new ArrayBuffer(16))) === 'DataView(16)' &&
    describeValueType(new ArrayBuffer(8)) === 'ArrayBuffer(8)' &&
    describeValueType(new SharedArrayBuffer(8)) === 'SharedArrayBuffer(8)';
}
function testDescribeBufferProperty() {
  // The `.buffer` behind a view — plus every other view over the same
  // bytes — reads by its own size, never as raw `$type` JSON.
  const buf = new Uint8Array([1, 2, 3]).buffer;
  const buf4 = new ArrayBuffer(4);
  new Uint8Array(buf4).set([9, 8, 7, 6]);
  return describeValueType(buf) === 'ArrayBuffer(3)' &&
    describeValueType(new Uint8Array(buf)) === 'Uint8Array(3) [1, 2, 3]' &&
    describeValueType(new DataView(buf)) === 'DataView(3)' &&
    describeValueType(new Uint16Array(buf4)) === 'Uint16Array(2) [2057, 1543]' &&
    describeValueType(new DataView(new ArrayBuffer(16), 4, 8)) === 'DataView(8)';
}
function testDescribeSubarray() {
  const u8 = new Uint8Array([1, 2, 3]);
  return describeValueType(u8.subarray(1)) === 'Uint8Array(2) [2, 3]' &&
    describeValueType(u8.slice(1)) === 'Uint8Array(2) [2, 3]';
}
function testDescribeLeaves() {
  return describeValueType(new Date('2024-01-02T00:00:00.000Z')) === 'Date("2024-01-02T00:00:00.000Z")' &&
    describeValueType(/ab+c/gi) === '/ab+c/gi' &&
    describeValueType(new TypeError('oops')) === 'TypeError: oops' &&
    describeValueType(new Error()) === 'Error' &&
    describeValueType(123n) === '123n' &&
    describeValueType(Promise.resolve()) === 'Promise' &&
    describeValueType(new WeakMap()) === 'WeakMap' &&
    describeValueType(new WeakSet()) === 'WeakSet' &&
    describeValueType(new URL('https://example.com/x')) === 'URL("https://example.com/x")';
}
function testDescribeClassInstance() {
  const vec = Object.assign(Object.create((class Vec3 {}).prototype), {x: 1});
  return describeValueType(vec) === 'Vec3 {x: 1}';
}
function testDescribePlainUnaffected() {
  return describeValueType({a: 1}) === '{a: 1}' &&
    describeValueType([1, 2]) === '[1, 2]' &&
    describeValueType('x') === '"x"' &&
    describeValueType(1) === '1';
}
function testPrettyTypedArray() {
  return prettyValue(new Uint8Array([1, 2, 3])) === 'Uint8Array(3) [\n  1\n  2\n  3\n]' &&
    prettyValue(new Uint8Array(0)) === 'Uint8Array(0) []' &&
    prettyValue(new BigInt64Array([1n])) === 'BigInt64Array(1) [\n  1n\n]';
}
function testPrettyTypedArrayBounded() {
  const text = prettyValue(new Uint8Array(Array.from({length: 30}, (_, i) => i)));
  const lines = new Set(text.split('\n'));
  return text.startsWith('Uint8Array(30) [') && text.includes('...(+10 more)') &&
    lines.has('  19') && !lines.has('  29');
}
function testPrettyLeaves() {
  const vec = Object.assign(Object.create((class Vec3 {}).prototype), {x: 1});
  return prettyValue(new DataView(new ArrayBuffer(16))) === 'DataView(16)' &&
    prettyValue(new ArrayBuffer(8)) === 'ArrayBuffer(8)' &&
    prettyValue(new Uint8Array([1, 2, 3]).buffer) === 'ArrayBuffer(3)' &&
    prettyValue(new DataView(new Uint8Array([1, 2, 3]).buffer)) === 'DataView(3)' &&
    prettyValue(new SharedArrayBuffer(8)) === 'SharedArrayBuffer(8)' &&
    prettyValue(new Date('2024-01-02T00:00:00.000Z')) === 'Date("2024-01-02T00:00:00.000Z")' &&
    prettyValue(/ab+c/gi) === '/ab+c/gi' &&
    prettyValue(new TypeError('oops')) === 'TypeError: oops' &&
    prettyValue(123n) === '123n' &&
    prettyValue(Promise.resolve()) === 'Promise' &&
    prettyValue(new WeakMap()) === 'WeakMap' &&
    prettyValue(vec) === 'Vec3 {\n  x: 1\n}';
}
function testPrettyPlainUnaffected() {
  return prettyValue({a: 1}) === undefined &&
    prettyValue([1, 2]) === undefined &&
    prettyValue('x') === undefined &&
    prettyValue(1) === undefined &&
    prettyValue(null) === undefined;
}
function testFormatCompareNoDollarType() {
  const vec = Object.assign(Object.create((class Vec3 {}).prototype), {x: 1});
  const cases = [
    formatCompare('number', new Uint8Array([1, 2, 3])).actualPretty,
    formatCompare('number', 123n).actualPretty,
    formatCompare('number', new TypeError('oops')).actualPretty,
    formatCompare('number', vec).actualPretty,
    formatCompare('number', new ArrayBuffer(8)).actualPretty,
    formatCompare('number', new DataView(new ArrayBuffer(4))).actualPretty,
  ];
  if (cases.some((_) => _.includes('$type'))) {
    return false;
  }
  return cases[0].includes('Uint8Array(3) [') &&
    cases[1].includes('123n') &&
    cases[2].includes('TypeError: oops') &&
    cases[3].includes('Vec3 {') &&
    cases[4].includes('ArrayBuffer(8)');
}
function testFormatComparePlainUnaffected() {
  const {actualPretty} = formatCompare('number', {a: 1});
  return actualPretty.includes('"a"') && !actualPretty.includes('Vec3');
}
function testSnipNoDollarType() {
  const vec = Object.assign(Object.create((class Vec3 {}).prototype), {x: 1});
  const cases = [
    snip(new Uint8Array([1, 2, 3])),
    snip(123n),
    snip(new TypeError('oops')),
    snip(vec),
    snip(new ArrayBuffer(8)),
    snip(new Uint8Array([1, 2, 3]).buffer),
    snip(new DataView(new Uint8Array([1, 2, 3]).buffer)),
  ];
  if (cases.some((_) => _.includes('$type'))) {
    return false;
  }
  return cases[0] === 'Uint8Array(3) [1, 2, 3]' &&
    cases[1] === '123n' &&
    cases[2] === 'TypeError: oops' &&
    cases[3] === 'Vec3 {x: 1}' &&
    cases[5] === 'ArrayBuffer(3)' &&
    cases[6] === 'DataView(3)';
}
function testSnipPlainUnaffected() {
  return snip({a: 1}) === '{"a":1}' && snip([1, 2]) === '[1,2]' && snip('x') === '"x"';
}
function testStringifySharedArrayBuffer() {
  return JSON.stringify(stringifyValue(new SharedArrayBuffer(8))) ===
    JSON.stringify({$type: 'SharedArrayBuffer', byteLength: 8});
}
function testInspectSummaryShowsTypedArray() {
  // End to end: the `Argument of type …` summary reads console-style
  // instead of `{"$type": "Uint8Array", …}` JSON.
  const msgs = captureMessages(() => {
    inspectType(new Uint8Array([1, 2, 3]), 'number', 'loc', 'name');
  });
  if (msgs.length !== 1) {
    return false;
  }
  const [summary] = msgs[0].strings;
  return summary.includes('Uint8Array(3) [1, 2, 3]') && !summary.includes('$type');
}
function testWarningTypedArrayCell() {
  const {warn, restore} = warningFor(new Uint8Array([1, 2, 3]));
  try {
    const text = dump(warn.td_value);
    const [tree] = warn.td_value.children;
    return text.includes('Uint8Array(3)') && text.includes('0: 1') && text.includes('2: 3') &&
      !text.includes('$type') && tree?.open === true;
  } finally {
    restore();
  }
}
function testWarningTypedArrayCellBounded() {
  const {warn, restore} = warningFor(new Uint8Array(Array.from({length: 30}, (_, i) => i)));
  try {
    const text = dump(warn.td_value);
    // Summary plus 20 entry rows plus the `...(+N more)` marker.
    const rows = warn.td_value.children[0]?.children ?? [];
    const lines = new Set(text.split(/[\n ]+/));
    return text.includes('Uint8Array(30)') && text.includes('...(+10 more)') &&
      rows.length === 22 && !lines.has('29:');
  } finally {
    restore();
  }
}
function testWarningLeafCell() {
  const cases = [
    [Promise.resolve(), 'Promise'],
    [new WeakMap(), 'WeakMap'],
    [new ArrayBuffer(8), 'ArrayBuffer(8)'],
    [123n, '123n'],
  ];
  for (const [value, want] of cases) {
    const {warn, restore} = warningFor(value);
    try {
      const text = dump(warn.td_value);
      if (!text.includes(want) || text.includes('[object') || text.includes('$type')) {
        return false;
      }
    } finally {
      restore();
    }
  }
  return true;
}
function testWarningNestedTypedArray() {
  // A typed array nested in a plain object reads as a one-liner, never
  // `[object Uint8Array]`.
  const {warn, restore} = warningFor({t: new Uint8Array([1, 2])});
  try {
    const text = dump(warn.td_value);
    return !text.includes('[object Uint8Array]') && text.includes('Uint8Array(2) [1, 2]');
  } finally {
    restore();
  }
}
function testWarningPlainUnaffected() {
  const {warn, restore} = warningFor({a: 1});
  try {
    const text = dump(warn.td_value);
    return text.includes('a') && text.includes('1') && !text.includes('Uint8Array');
  } finally {
    restore();
  }
}
/**
 * A `Window`-shaped host object: circular self links, nested host objects
 * up front and hundreds of trailing keys.
 * @returns {object} The fixture.
 */
function giantWindow() {
  class FakeWindow {}
  class FakeDocument {}
  class FakeLocation {}
  const win = new FakeWindow();
  win.window = win;
  win.self = win;
  win.document = Object.assign(new FakeDocument(), {
    location: Object.assign(new FakeLocation(), {href: 'https://x/', origin: 'https://x'}),
  });
  win.name = '';
  win.location = win.document.location;
  for (let i = 0; i < 200; i++) {
    win[`prop${i}`] = i;
  }
  return win;
}
/**
 * An instance with exactly `n` keys for pinning the collapse threshold.
 * @param {number} n - Key count.
 * @returns {object} The fixture.
 */
function sizedInstance(n) {
  class Sized {}
  const obj = new Sized();
  for (let i = 0; i < n; i++) {
    obj[`k${i}`] = i;
  }
  return obj;
}
function testDescribeGiantInstanceCollapsesToTag() {
  return describeValueType(giantWindow()) === 'FakeWindow';
}
function testDescribeCollapseBoundary() {
  // Anything beyond the Actual pane listing budget reads as its bare tag.
  return describeValueType(sizedInstance(20)).startsWith('Sized {') &&
    describeValueType(sizedInstance(21)) === 'Sized';
}
function testPrettyGiantInstanceCollapsesToTag() {
  return prettyValue(giantWindow()) === 'FakeWindow' &&
    prettyValue(sizedInstance(20)).startsWith('Sized {') &&
    prettyValue(sizedInstance(21)) === 'Sized';
}
function testSnipGiantInstanceCollapsesToTag() {
  return snip(giantWindow()) === 'FakeWindow';
}
function testNestedGiantCollapses() {
  const outer = Object.assign(Object.create((class Box {}).prototype), {label: 'x', win: giantWindow()});
  return describeValueType(outer) === 'Box {label: "x", win: FakeWindow}';
}
function testInspectSummaryShowsGiantTag() {
  // End to end: the `Argument of type …` summary names the host instead of
  // dumping its nested internals.
  const msgs = captureMessages(() => {
    inspectType(giantWindow(), 'number', 'loc', 'name');
  });
  if (msgs.length !== 1) {
    return false;
  }
  const [summary] = msgs[0].strings;
  return summary.includes('FakeWindow') && !summary.includes('$type') &&
    !summary.includes('prop0') && summary.length < 200;
}
/**
 * Simulates the worker-to-UI trip for unclonable values: snapshot, then a
 * clone round trip like messaging performs.
 * @param {*} value - The live value.
 * @returns {*} The snapshot the comparator receives.
 */
function snapshotOf(value) {
  return JSON.parse(JSON.stringify(stringifyValue(value)));
}
function testDescribeSnapshotWindow() {
  return describeValueType(snapshotOf(giantWindow())) === 'FakeWindow';
}
function testPrettySnapshotWindowBlock() {
  const text = prettyValue(snapshotOf(giantWindow()));
  return text.startsWith('FakeWindow {') && text.includes('name') &&
    text.includes('FakeDocument') && !text.includes('$type') &&
    !text.includes('[object');
}
function testSnipSnapshotWindow() {
  return snip(snapshotOf(giantWindow())) === 'FakeWindow';
}
function testFormatCompareSnapshotActual() {
  const {actualPretty} = formatCompare('number', snapshotOf(giantWindow()));
  return actualPretty.startsWith('FakeWindow {') && !actualPretty.includes('$type');
}
function testSnapshotMapWithFunction() {
  // Containers holding functions cannot cross realms either: entries arrive
  // recorded, sizes intact.
  const snapshot = stringifyValue(new Map([['k', () => {}]]));
  if (describeValueType(snapshot) !== 'Map(1)') {
    return false;
  }
  const text = prettyValue(snapshot);
  return text.startsWith('Map(1) {') && text.includes('=>');
}
function testSnapshotBigint() {
  return describeValueType({$type: 'bigint', value: '123'}) === '123n' &&
    prettyValue({$type: 'bigint', value: '123'}) === '123n';
}
function testSnapshotTypedArray() {
  const snapshot = {$type: 'Uint8Array', length: 2, values: [1, 2]};
  if (describeValueType(snapshot) !== 'Uint8Array(2)') {
    return false;
  }
  const text = prettyValue(snapshot);
  return text.startsWith('Uint8Array(2) [') && text.includes('1') && !text.includes('$type');
}
function testUserDataDollarTypeUnaffected() {
  // Genuine data in the same shape (lowercase tags like query operators)
  // keeps expanding instead of collapsing to a tag.
  const data = {$type: 'string', a: 1};
  return describeValueType(data).includes('a: 1') &&
    describeValueType(data) !== 'string' &&
    prettyValue(data) === undefined &&
    snip(data).includes('a');
}
function testPanelSnapshotCapturesBeyondLogBreadth() {
  // Unclonable values post roomy snapshots: hundreds of keys arrive, so
  // tree batches yield data instead of ending at a tombstone row.
  const wide = {handler: () => {}};
  for (let i = 0; i < 401; i++) {
    wide[`k${i}`] = i;
  }
  const msgs = captureMessages(() => {
    inspectType(wide, 'number', 'loc', 'name');
  });
  if (msgs.length !== 1) {
    return false;
  }
  const {value} = msgs[0];
  return value.k400 === 400 &&
    !Object.keys(value).some((key) => key.startsWith('[...+'));
}
const tests = [
  testDescribeTypedArrays,
  testDescribeTypedArrayBounded,
  testDescribeTypedArrayDepthZero,
  testDescribeBuffers,
  testDescribeBufferProperty,
  testDescribeSubarray,
  testDescribeLeaves,
  testDescribeClassInstance,
  testDescribePlainUnaffected,
  testPrettyTypedArray,
  testPrettyTypedArrayBounded,
  testPrettyLeaves,
  testPrettyPlainUnaffected,
  testFormatCompareNoDollarType,
  testFormatComparePlainUnaffected,
  testSnipNoDollarType,
  testSnipPlainUnaffected,
  testStringifySharedArrayBuffer,
  testInspectSummaryShowsTypedArray,
  testWarningTypedArrayCell,
  testWarningTypedArrayCellBounded,
  testWarningLeafCell,
  testWarningNestedTypedArray,
  testWarningPlainUnaffected,
  testDescribeGiantInstanceCollapsesToTag,
  testDescribeCollapseBoundary,
  testPrettyGiantInstanceCollapsesToTag,
  testSnipGiantInstanceCollapsesToTag,
  testNestedGiantCollapses,
  testInspectSummaryShowsGiantTag,
  testDescribeSnapshotWindow,
  testPrettySnapshotWindowBlock,
  testSnipSnapshotWindow,
  testFormatCompareSnapshotActual,
  testSnapshotMapWithFunction,
  testSnapshotBigint,
  testSnapshotTypedArray,
  testUserDataDollarTypeUnaffected,
  testPanelSnapshotCapturesBeyondLogBreadth,
];
export {tests};
