import {parse} from '@babel/parser';
import {parserOptions} from './parserOptions.js';
import {Asserter} from './Asserter.js';
import {expandType} from './expandType.js';
/**
 * @param {string} src - Source code to convert.
 * @param {object} [options] - Asserter options.
 * @returns {string} Converted code.
 */
function convert(src, options) {
  const asserter = new Asserter({expandType, addHeader: false, filename: 'test.js', ...options});
  return asserter.toSource(parse(src, parserOptions));
}
function testDefaultWraps() {
  const out = convert('const x = a[i];');
  if (!out.includes('inspectIndexedAccess(a, i,')) {
    return false;
  }
  return true;
}
function testFlagOffDrops() {
  const out = convert('const x = a[i];', {inspectIndexedAccess: false});
  if (out.includes('inspectIndexedAccess')) {
    return false;
  }
  if (!out.includes('a[i]')) {
    return false;
  }
  return true;
}
function testReceiverCallBypassed() {
  const out = convert('handlers[i](x);');
  if (out.includes('inspectIndexedAccess')) {
    return false;
  }
  return true;
}
function testReceiverKeptAtRuntime() {
  // `this` must survive: base of `a[0](x)` is `a`, not undefined.
  // eslint-disable-next-line no-new-func -- must execute converted code to prove receiver semantics
  const run = new Function('a', 'x', `return (${convert('a[0](x);').replace(/;\s*$/, '')});`);
  const arr = [function receiver() {
    return this === arr ? 'kept' : 'LOST';
  }];
  return run(arr, 0) === 'kept';
}
function testTagBypassed() {
  const out = convert('a[i]`x`;');
  if (out.includes('inspectIndexedAccess')) {
    return false;
  }
  return true;
}
function testDestructuringBypassed() {
  // NB: `const [a[0]] = ...` is invalid JS (lexical declarations reject
  // member targets), so only bare-assignment patterns are covered here.
  for (const src of ['[a[0]] = [1];', '({p: a[0]} = {p: 1});', '[...a.b] = [1];', '[a[0] = 5] = [];']) {
    const out = convert(src);
    if (out.includes('inspectIndexedAccess')) {
      return false;
    }
  }
  return true;
}
function testForTargetsBypassed() {
  for (const src of ['for (a[0] of [1]) {}', 'for (a[0] in {}) {}']) {
    const out = convert(src);
    if (out.includes('inspectIndexedAccess')) {
      return false;
    }
  }
  return true;
}
function testReadsKept() {
  // Default values, computed keys and literal values are reads: still wrapped.
  for (const src of ['const [x = a[0]] = [];', 'const o = {[a[0]]: 1};', 'const o = ({p: a[0]});']) {
    const out = convert(src);
    if (!out.includes('inspectIndexedAccess(a, 0,')) {
      return false;
    }
  }
  return true;
}
function testNewCalleeParenthesized() {
  const out = convert('new T[i](x);');
  if (!out.includes('new (inspectIndexedAccess(T, i,')) {
    return false;
  }
  return true;
}
export const tests = [
  testDefaultWraps,
  testFlagOffDrops,
  testReceiverCallBypassed,
  testReceiverKeptAtRuntime,
  testTagBypassed,
  testDestructuringBypassed,
  testForTargetsBypassed,
  testReadsKept,
  testNewCalleeParenthesized,
];
