import {overloadNameKey} from './overloadNameKey.js';
// A static name renders as a quoted key.
function testStaticNameRendersQuoted() {
  const actual = overloadNameKey(null, 'greet');
  return actual === '["greet"]';
}
// A dynamic key renders as the captured expression.
function testDynamicKeyRendersCaptured() {
  const actual = overloadNameKey('rtiOverloadKey', null);
  return actual === '[rtiOverloadKey]';
}
export const tests = [testStaticNameRendersQuoted, testDynamicKeyRendersCaptured];
