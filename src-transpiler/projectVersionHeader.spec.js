import {addTypeChecks} from './addTypeChecks.js';
import {expandType} from './expandType.js';
const SRC = '/** @param {number} a - A. */\nfunction f(a) {\n}\nf(1);\n';
const tests = [
  // The version is funneled into the header when the plugin option is set.
  () => addTypeChecks(SRC, {expandType, projectVersion: '9.9.9'}).includes('setProjectVersion("9.9.9")'),
  // ... and nothing is emitted otherwise (golden outputs stay untouched).
  () => !addTypeChecks(SRC, {expandType}).includes('setProjectVersion'),
];
export {tests};
