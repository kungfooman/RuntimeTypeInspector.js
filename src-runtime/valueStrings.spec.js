import {inspectType} from './inspectType.js';
import {options} from './options.js';
import {captureMessages} from '../src-unittest/index.js';
function testUnclonableStaysStructured() {
  // Issue #134 item 8: class instances with methods (functions) are not
  // structured-cloneable; the log must carry content, not "[object Object]".
  const prev = options.exactObjects;
  options.exactObjects = false;
  let msgs;
  try {
    msgs = captureMessages(() => {
      inspectType({type: 'sphere', material: {name: 'Untitled', update() {}}, castShadows: false}, 'number', 'loc', 'name');
    });
  } finally {
    options.exactObjects = prev;
  }
  if (msgs.length !== 1) {
    return false;
  }
  const [msg] = msgs;
  return typeof msg.value === 'object' && msg.value.type === 'sphere' &&
    msg.valueToString !== '[object Object]' && msg.valueToString.includes('sphere');
}
function testPreviewNeverBareObject() {
  const msgs = captureMessages(() => {
    inspectType({a: 1}, 'number', 'loc', 'name');
  });
  return msgs.length === 1 && msgs[0].valueToString !== '[object Object]' &&
    msgs[0].valueToString.includes('"a"');
}
function testExtrasSnapshotted() {
  const prev = options.exactObjects;
  options.exactObjects = true;
  let msgs;
  try {
    msgs = captureMessages(() => {
      inspectType({a: 1, f: () => {}}, {type: 'object', properties: {a: 'number'}}, 'loc', 'name');
    });
  } finally {
    options.exactObjects = prev;
  }
  if (msgs.length !== 1) {
    return false;
  }
  const extra = msgs[0].extras.find((_) => _ && typeof _ === 'object' && 'value' in _);
  return !!extra && typeof extra.value === 'object' && extra.value.a === 1;
}
const tests = [
  testUnclonableStaysStructured,
  testPreviewNeverBareObject,
  testExtrasSnapshotted,
];
export {tests};
