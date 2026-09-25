import {parse} from '@babel/parser';
import {parserOptions} from './parserOptions.js';
import {Asserter} from './Asserter.js';
import {expandType} from './expandType.js';
/**
 * @param {string} src - Source code with one class to convert.
 * @returns {{out: string, warnings: any[]}} Converted code and warnings.
 */
function shapeFor(src) {
  const warnings = [];
  const origWarn = console.warn;
  console.warn = (...args) => warnings.push(args);
  const asserter = new Asserter({expandType, addHeader: false, filename: 'test.js'});
  const out = asserter.getHeader() + asserter.toSource(parse(src, parserOptions));
  console.warn = origWarn;
  return {out, warnings};
}
// Field initializers infer number, string and boolean.
function testFieldInference() {
  const {out, warnings} = shapeFor('class A { x = 1; s = "a"; b = true; }');
  if (!out.includes(`registerTypedef('A'`)) {
    return false;
  }
  if (!out.includes('"x": "number"') || !out.includes('"s": "string"') || !out.includes('"b": "boolean"')) {
    return false;
  }
  return warnings.length === 0;
}
// Field JSDoc wins over the inferred initializer type.
function testJSDocBeatsInference() {
  const {out, warnings} = shapeFor('class A { /** @type {string} */ x = 1; }');
  if (!out.includes('"x": "string"') || out.includes('"x": "number"')) {
    return false;
  }
  return warnings.length === 0;
}
// A bare field with no type info emits no typedef.
function testBareFieldSkipped() {
  const {out, warnings} = shapeFor('class A { x; }');
  if (out.includes('registerTypedef')) {
    return false;
  }
  return warnings.length === 0;
}
// Static and private members never enter the shape.
function testStaticAndPrivateSkipped() {
  const {out} = shapeFor('class A { static s = 1; x = 1; }');
  if (!out.includes('"x": "number"') || out.includes('"s"')) {
    return false;
  }
  return true;
}
// Constructor writes infer types, JSDoc wins.
function testConstructorAssign() {
  const {out, warnings} = shapeFor('class A { constructor() { this.n = 5; /** @type {string} */ this.t = "x"; } }');
  if (!out.includes('"n": "number"') || !out.includes('"t": "string"')) {
    return false;
  }
  return warnings.length === 0;
}
// The field declaration wins constructor conflicts silently.
function testFieldBeatsConstructor() {
  // Declaration site wins silently when only one side is JSDoc.
  const {out, warnings} = shapeFor('class A { /** @type {string} */ x = "a"; constructor() { this.x = 1; } }');
  if (!out.includes('"x": "string"')) {
    return false;
  }
  return warnings.length === 0;
}
// Two conflicting JSDocs warn and the field wins.
function testConflictingJSDocWarns() {
  // Two humans disagreeing: field wins, warning emitted.
  const {out, warnings} = shapeFor('class A { /** @type {string} */ x = "a"; constructor() { /** @type {number} */ this.x = 1; } }');
  if (!out.includes('"x": "string"')) {
    return false;
  }
  return warnings.some(args => args.join(' ').includes('conflicting JSDoc types'));
}
// Conditional writes become optional props.
function testConditionalIsOptional() {
  const {out} = shapeFor('class A { constructor(o) { if (o) this.c = true; } }');
  if (!out.includes('"c"') || !out.includes('"optional": true')) {
    return false;
  }
  return true;
}
// Inline Object.assign literals contribute their keys.
function testObjectAssignInline() {
  const {out} = shapeFor('class A { constructor() { Object.assign(this, { w: 1 }); } }');
  return out.includes('"w": "number"');
}
// Methods harvest as Function, getter-only as readonly.
function testMethodsAndAccessors() {
  const {out} = shapeFor('class A { m() {} get ro() { return 1; } get rw() { return 1; } set rw(v) {} }');
  if (!out.includes('"m": "Function"')) {
    return false;
  }
  if (!out.includes('"readonly": true')) {
    return false;
  }
  return true;
}
// An empty class emits no typedef.
function testEmptyClassSkipped() {
  const {out, warnings} = shapeFor('class A {}');
  if (out.includes('registerTypedef')) {
    return false;
  }
  return warnings.length === 0;
}
// Anonymous classes emit no typedef.
function testAnonymousSkipped() {
  const {out} = shapeFor('const A = class { x = 1; };');
  return !out.includes('registerTypedef');
}
const tests = [
  testFieldInference,
  testJSDocBeatsInference,
  testBareFieldSkipped,
  testStaticAndPrivateSkipped,
  testConstructorAssign,
  testFieldBeatsConstructor,
  testConflictingJSDocWarns,
  testConditionalIsOptional,
  testObjectAssignInline,
  testMethodsAndAccessors,
  testEmptyClassSkipped,
  testAnonymousSkipped,
];
export {tests};
