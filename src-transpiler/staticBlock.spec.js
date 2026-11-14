import {parse        } from '@babel/parser';
import {parserOptions} from './parserOptions.js';
import {Asserter     } from './Asserter.js';
import {expandType   } from './expandType.js';
/**
 * @param {string} src - Source code to convert.
 * @returns {string} Converted code.
 */
function convert(src) {
  const asserter = new Asserter({
    expandType,
    addHeader: false,
    filename: 'test.js',
  });
  return asserter.toSource(parse(src, parserOptions));
}
function testStaticBlockRoundTrips() {
  // Static init blocks carry no params: they must survive transpilation
  // verbatim instead of degrading into an unhandled-node placeholder.
  const src = `class Vec3 {
  static {
    console.log("once");
  }
}`;
  const out = convert(src);
  if (out.includes('rtiUnhandled')) {
    return false;
  }
  return out.includes('static {') && out.includes('console.log("once");');
}
function testStaticBlockExecutes() {
  // The emitted block must still run at class definition time. The trailing
  // registerClass call belongs to the bundle header, so stub it here.
  const src = `class Vec3 {
  static {
    console.log("once");
  }
}`;
  const out = convert(src);
  // new Function must execute converted code to prove runtime semantics
  const run = new Function('registerClass', 'console', `${out}`); // eslint-disable-line no-new-func -- must execute converted code to prove block semantics
  let logged = '';
  const onLog = (value) => {
    logged = value;
  };
  const fakeConsole = {
    log: onLog,
  };
  run(() => {}, fakeConsole);
  return logged === 'once';
}
function testStaticBlockSkipsChecks() {
  // No param checks belong in a static block: the documented `@type` on the
  // flag assignment is a property annotation, not a function contract.
  const src = `class Vec3 {
  static {
    /** @type {boolean} */
    this.ready = true;
  }
}`;
  const out = convert(src);
  return !out.includes('inspectType');
}
export const tests = [
  testStaticBlockRoundTrips,
  testStaticBlockExecutes,
  testStaticBlockSkipsChecks,
];
