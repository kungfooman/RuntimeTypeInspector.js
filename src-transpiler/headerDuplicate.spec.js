import {addTypeChecks} from './addTypeChecks.js';
import {expandType   } from './expandType.js';
// A namespace import registers once per file: every later import statement
// in the same module must not re-emit the registration, or bundles carry
// one copy per import (three.js showed four `commonjsHelpers` lines).
const NAMESPACE_SRC = 'import * as helpers from \'./helpers.js\';\nimport x from \'./x.js\';\nimport y from \'./y.js\';\nconsole.log(helpers, x, y);\n';
/**
 * Counts exact occurrences of a needle in converted output.
 * @param {string} out - Converted code.
 * @param {string} needle - Snippet to count.
 * @returns {number} Occurrence count.
 */
function countIn(out, needle) {
  return out.split(needle).length - 1;
}
function testNamespaceRegistersOnce() {
  // One namespace import plus two plain imports: exactly one registration.
  const out = addTypeChecks(NAMESPACE_SRC, {expandType});
  return countIn(out, 'registerImportNamespaceSpecifier(\'helpers\', helpers);') === 1;
}
function testNamespaceRegistersOncePerName() {
  // Two distinct namespaces: exactly one registration each, no cross-talk.
  const src = 'import * as a from \'./a.js\';\nimport * as b from \'./b.js\';\nimport c from \'./c.js\';\nconsole.log(a, b, c);\n';
  const out = addTypeChecks(src, {expandType});
  return countIn(out, 'registerImportNamespaceSpecifier(\'a\', a);') === 1 &&
    countIn(out, 'registerImportNamespaceSpecifier(\'b\', b);') === 1;
}
function testProjectVersionEmitsOnce() {
  // The version header is per-module metadata: one module emits it once no
  // matter how many statements follow (three.js showed ~185 copies, one per
  // module, because explicit `null` did not switch it off).
  const src = '/** @param {number} a - A. */\nfunction f(a) {\n}\nf(1);\nf(2);\n';
  const out = addTypeChecks(src, {
    expandType,
    projectVersion: '9.9.9',
  });
  return countIn(out, 'setProjectVersion("9.9.9");') === 1;
}
function testProjectVersionNullEmitsNothing() {
  // Explicit `null` switches the version header off (bundler plugins pass
  // `null` when the host version must not stamp every module); only
  // `undefined` falls through to package.json auto-resolution.
  const src = '/** @param {number} a - A. */\nfunction f(a) {\n}\nf(1);\n';
  const out = addTypeChecks(src, {
    expandType,
    projectVersion: null,
  });
  return !out.includes('setProjectVersion');
}
export const tests = [
  testNamespaceRegistersOnce,
  testNamespaceRegistersOncePerName,
  testProjectVersionEmitsOnce,
  testProjectVersionNullEmitsNothing,
];
