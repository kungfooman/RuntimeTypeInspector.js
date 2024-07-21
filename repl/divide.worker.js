import {inspectType, youCanAddABreakpointHere, validateDivision} from '@runtime-type-inspector/runtime';
/**
 * @param {number} a
 * @param {number} b
 */
function divide(a, b) {
  if (!inspectType(a, "number", 'divide', 'a')) {
    youCanAddABreakpointHere();
  }
  if (!inspectType(b, "number", 'divide', 'b')) {
    youCanAddABreakpointHere();
  }
  return validateDivision(a, b, "divide");
}
function f() {
  /** @type {number[]} */
  const arr = [10_20];
  const [a, b] = arr;
  const ret = divide(a, b);
  self.postMessage(`ret ${ret}`);
}
f();
setInterval(f, 2000); // Test spam mode

/*
import {typePanel} from '@runtime-type-inspector/runtime';
import {WorkerWithImportMapViaBedfordsShim} from 'worker-with-import-map';
// console.log("WorkerWithImportMapViaBedfordsShim", WorkerWithImportMapViaBedfordsShim);
// const url = './add.worker.js';
const url = './divide.worker.js';
const worker = new WorkerWithImportMapViaBedfordsShim(url, {
  importMap: 'inherit'
});
console.log("worker", worker);
worker.addEventListener('message', (e) => {
  // console.log('addEventListener message', e.data);
  if (e.data.type !== 'rti') {
    return;
  }
  e.preventDefault();
  e.stopPropagation();
  // Forward message to window listener:
  // window.postMessage(e.data);
  // Forward event directly to typePanel:
  typePanel.handleEvent(e);
});
*/
