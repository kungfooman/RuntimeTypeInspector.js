import {tagSnapshot} from './tagSnapshot.js';
import {registerClass} from './registerClass.js';
import {inspectType} from './inspectType.js';
class TagSnapBase {}
class TagSnapSub extends TagSnapBase {
  constructor() {
    super();
    this.x = 1;
  }
}
class TagSnapWidget {
  constructor() {
    this.w = 1;
  }
}
registerClass(TagSnapBase);
registerClass(TagSnapSub);
registerClass(TagSnapWidget);
function testPlainDataIdentity() {
  // No instances: the input posts untouched, no extra clone.
  const data = {a: 1, list: [1, 2], nested: {b: 'x'}};
  return tagSnapshot(data) === data;
}
function testPrimitivesIdentity() {
  // Primitives and null pass straight through.
  return tagSnapshot(1) === 1 && tagSnapshot('x') === 'x' && tagSnapshot(null) === null;
}
function testInstanceTagged() {
  // Registered instances clone with their nominal tag.
  const out = tagSnapshot(new TagSnapWidget());
  return out !== null && typeof out === 'object' && out.$type === 'TagSnapWidget' && out.w === 1;
}
function testNestedInstancesTagged() {
  // Instances nested in plain containers are found, containers stay plain.
  const out = tagSnapshot({items: [new TagSnapWidget()], plain: {y: 2}});
  return out !== null && typeof out === 'object' && out.$type === undefined &&
    out.items[0].$type === 'TagSnapWidget' && out.plain.$type === undefined;
}
function testUnregisteredUntagged() {
  // Unknown constructors stay untagged: nominal matching needs the registry.
  class Ghost {}
  const out = tagSnapshot(new Ghost());
  return out !== null && typeof out === 'object' && out.$type === undefined;
}
function testTypedArrayTagged() {
  // Typed arrays keep layout but gain a self-identifying tag.
  const out = tagSnapshot(new Float32Array([1, 2]));
  return out instanceof Float32Array && out.$type === 'Float32Array';
}
function testMapUntagged() {
  // Natively handled containers post untouched.
  const map = new Map([['a', 1]]);
  return tagSnapshot(map) === map;
}
function testCyclesSafe() {
  // Cyclic graphs terminate with the cycle intact and tags applied.
  const widget = new TagSnapWidget();
  const root = {widget};
  root.self = root;
  const out = tagSnapshot(root);
  return out !== root && out.self === out && out.widget.$type === 'TagSnapWidget';
}
function testNeverThrows() {
  // Hostile values fall back to the input for today's behavior.
  const proxy = new Proxy({}, {getPrototypeOf() {
    throw new Error('nope');
  }});
  return tagSnapshot(proxy) === proxy;
}
function testPostedValuesTagged() {
  // End to end: a failing check posts the tagged snapshot, not the live instance.
  const prevParent = globalThis.parent;
  let posted = null;
  globalThis.parent = {postMessage: (msg) => {
    posted = msg;
  }};
  try {
    inspectType(new TagSnapWidget(), 'string', 'TagSnapLoc', 'tagSnapName');
  } finally {
    globalThis.parent = prevParent;
  }
  return !!posted && posted.value && posted.value.$type === 'TagSnapWidget' && posted.value.w === 1;
}
const tests = [
  testPlainDataIdentity,
  testPrimitivesIdentity,
  testInstanceTagged,
  testNestedInstancesTagged,
  testUnregisteredUntagged,
  testTypedArrayTagged,
  testMapUntagged,
  testCyclesSafe,
  testNeverThrows,
  testPostedValuesTagged,
];
export {tests};
