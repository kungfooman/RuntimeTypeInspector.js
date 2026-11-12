import {parse} from '@babel/parser';
import {parserOptions} from './parserOptions.js';
import {Asserter} from './Asserter.js';
import {expandTypeDepFree} from './expandTypeDepFree.js';
import {docReaderBoth} from './jsdoc-parsing-ts/docReaderBoth.js';
/**
 * Transpiles one function through a fresh Asserter, recording every
 * comment the injected docReader saw.
 * @param {string} src - Source with one documented function.
 * @param {object} [options] - Asserter options.
 * @returns {{seen: string[], out: string}} Seen comments and output.
 */
function transpileWith(src, options = {}) {
  const seen = [];
  const probe = (comment) => seen.push(comment);
  const asserter = new Asserter({
    expandType: expandTypeDepFree,
    addHeader: false,
    filename: 'test.js',
    ...options,
    docReader: options.docReader ?? probe,
  });
  const out = asserter.toSource(parse(src, parserOptions));
  return {seen, out};
}
// Absent when unset: no probe runs, no behavior change, checks intact.
function testAbsentDisablesProbe() {
  const src = '/** @param {number} x */ function f(x) { return x; } f(1);';
  const asserter = new Asserter({
    expandType: expandTypeDepFree,
    addHeader: false,
    filename: 'test.js',
  });
  if (asserter.docReader !== undefined) {
    return false;
  }
  const out = asserter.toSource(parse(src, parserOptions));
  return out.includes('inspectType(x, "number"');
}
// The injected probe sees every JSDoc comment at transpile time.
function testInjectedProbeSeesComments() {
  const src = '/** @param {number} x */ function f(x) { return x; } f(1);';
  const {seen, out} = transpileWith(src);
  if (seen.length !== 1 || !seen[0].includes('@param {number} x')) {
    return false;
  }
  return out.includes('inspectType(x, "number"');
}
// Garbage disables instead of crashing: a typo'd option never probes.
function testGarbageDisablesProbe() {
  const src = '/** @param {number} x */ function f(x) { return x; } f(1);';
  const asserter = new Asserter({
    expandType: expandTypeDepFree,
    addHeader: false,
    filename: 'test.js',
    docReader: 'docReaderBoth',
  });
  if (asserter.docReader !== undefined) {
    return false;
  }
  const out = asserter.toSource(parse(src, parserOptions));
  return out.includes('inspectType(x, "number"');
}
// The exported probe is itself injectable: the real `docReaderBoth`
// accepts the same bare comment the pipeline hands it.
function testExportedProbeAcceptsPipelineComment() {
  return docReaderBoth('@param {number} x') === 'SAME';
}
export const tests = [testAbsentDisablesProbe, testInjectedProbeSeesComments, testGarbageDisablesProbe, testExportedProbeAcceptsPipelineComment];
