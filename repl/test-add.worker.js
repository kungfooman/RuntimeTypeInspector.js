import {inspectType, youCanAddABreakpointHere} from '@runtime-type-inspector/runtime';
/**
 * @param {number} a
 * @param {number} b
 */
function add(a, b) {
  if (!inspectType(a, "number", 'add', 'a')) {
    youCanAddABreakpointHere();
  }
  if (!inspectType(b, "number", 'add', 'b')) {
    youCanAddABreakpointHere();
  }
  return a + b;
}
function f() {
  /** @type {number[]} */
  const arr = [10_20];
  const [a, b] = arr;
  const ret = add(a, b);
  self.postMessage(`ret ${ret}`);
}
f();
setInterval(f, 2000); // Test spam mode
