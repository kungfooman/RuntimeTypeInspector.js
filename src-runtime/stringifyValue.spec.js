import {stringifyValue} from './stringifyValue.js';
function testPrimitives() {
  if (stringifyValue(1) !== 1 || stringifyValue('a') !== 'a') {
    return false;
  }
  if (stringifyValue(true) !== true || stringifyValue(null) !== null) {
    return false;
  }
  return true;
}
function testCircular() {
  const obj = {a: 1};
  obj.self = obj;
  const out = stringifyValue(obj);
  if (out.self !== '[Circular ~]') {
    return false;
  }
  const root = {child: {name: 'x'}};
  root.child.parent = root;
  if (stringifyValue(root).child.parent !== '[Circular ~]') {
    return false;
  }
  return true;
}
function testDepthCap() {
  let deep = {v: 0};
  for (let i = 0; i < 10; i++) {
    deep = {next: deep};
  }
  if (JSON.stringify(stringifyValue(deep)).includes('"v"')) {
    return false;
  }
  return true;
}
function testBreadthCap() {
  const wide = {};
  for (let i = 0; i < 25; i++) {
    wide[`k${i}`] = i;
  }
  const out = stringifyValue(wide);
  if (out.k19 !== 19 || out.k20 !== undefined) {
    return false;
  }
  if (!('[...+N more keys]' in out)) {
    return false;
  }
  return true;
}
function testLongString() {
  const out = stringifyValue('x'.repeat(300));
  if (typeof out !== 'string' || out.length >= 300 || !out.includes('+100 chars')) {
    return false;
  }
  return true;
}
function testExoticTypes() {
  if (JSON.stringify(stringifyValue(123n)) !== JSON.stringify({$type: 'bigint', value: '123'})) {
    return false;
  }
  if (stringifyValue(undefined) !== '[undefined]') {
    return false;
  }
  if (stringifyValue(function named() {}) !== '[Function named]') {
    return false;
  }
  if (stringifyValue(Symbol('desc')) !== '[Symbol desc]') {
    return false;
  }
  // eslint-disable-next-line symbol-description -- undescribed symbols need coverage too
  if (stringifyValue(Symbol()) !== '[Symbol]') {
    return false;
  }
  return true;
}
function throwGetter() {
  throw new Error('getter');
}
function testThrowingGetter() {
  const obj = {ok: 1};
  Object.defineProperty(obj, 'boom', {enumerable: true, get: throwGetter});
  const out = stringifyValue(obj);
  if (out.ok !== 1 || out.boom !== '[Getter threw]') {
    return false;
  }
  return true;
}
function testRevokedProxy() {
  const {proxy, revoke} = Proxy.revocable({a: 1}, {});
  revoke();
  const out = stringifyValue(proxy);
  if (out !== '[Revoked Proxy]' && out !== '[Unreadable]') {
    return false;
  }
  return true;
}
function testContainers() {
  const out = stringifyValue({m: new Map([['a', 1]]), s: new Set([1, 2]), t: new Int32Array([1, 2, 3])});
  if (out.m.$type !== 'Map' || out.s.$type !== 'Set' || out.t.$type !== 'Int32Array') {
    return false;
  }
  if (JSON.stringify(out.t.values) !== '[1,2,3]') {
    return false;
  }
  if (JSON.stringify(stringifyValue(new Map())) !== JSON.stringify({$type: 'Map', size: 0, entries: []})) {
    return false;
  }
  return true;
}
function testClassTagAndSpecials() {
  class Vec3 {
    constructor() {
      this.x = 1;
    }
  }
  const out = stringifyValue(new Vec3());
  if (out.$type !== 'Vec3' || out.x !== 1) {
    return false;
  }
  if (stringifyValue(new Error('oops')).message !== 'oops') {
    return false;
  }
  if (stringifyValue(new Date('2024-01-02T00:00:00.000Z')) !== '2024-01-02T00:00:00.000Z') {
    return false;
  }
  if (stringifyValue(/ab+c/) !== '/ab+c/') {
    return false;
  }
  if (stringifyValue(Promise.resolve()) !== '[Promise]') {
    return false;
  }
  return true;
}
function testNeverThrowsNeverMegabytes() {
  // Kitchen sink: everything hostile at once must stringify safely and small.
  const {proxy, revoke} = Proxy.revocable({evil: 1}, {});
  revoke();
  const sink = {
    big: new Array(100000).fill(0),
    str: 'y'.repeat(100000),
    bigarr: new Float64Array(100000),
    map: new Map(Array.from({length: 1000}, (_, i) => [`k${i}`, i])),
    fn: function fn() {},
    sym: Symbol('s'),
    undef: undefined,
    bigi: 999n,
    err: new Error('x'),
    proxy,
  };
  sink.self = sink;
  Object.defineProperty(sink, 'getter', {enumerable: true, get: throwGetter});
  let json;
  try {
    json = JSON.stringify(stringifyValue(sink));
  } catch {
    return false;
  }
  // 200k+ hostile values must stay far below a megabyte.
  if (json.length > 100 * 1024) {
    return false;
  }
  return true;
}
export const tests = [
  testPrimitives,
  testCircular,
  testDepthCap,
  testBreadthCap,
  testLongString,
  testExoticTypes,
  testThrowingGetter,
  testRevokedProxy,
  testContainers,
  testClassTagAndSpecials,
  testNeverThrowsNeverMegabytes,
];
