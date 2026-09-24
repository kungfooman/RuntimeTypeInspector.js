import {validateType} from './validateType.js';
import {inspectTypeWithTemplates} from './inspectTypeWithTemplates.js';
import {registerTypedef, typedefs} from './registerTypedef.js';
import {expandType} from '../src-transpiler/expandType.js';
const warn = () => undefined;
function clearTypedefs() {
  Object.keys(typedefs).forEach((_) => delete typedefs[_]);
}
/**
 * Decidable true branch validates against the true type.
 * @returns {boolean} True when documented behavior holds.
 */
function testTrueBranch() {
  clearTypedefs();
  const expect = expandType('"a" extends string ? number : boolean');
  if (!validateType(1, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType('x', expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
/**
 * Decidable false branch validates against the false type.
 * @returns {boolean} True when documented behavior holds.
 */
function testFalseBranch() {
  clearTypedefs();
  const expect = expandType('1 extends string ? number : boolean');
  if (!validateType(true, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType(1, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
/**
 * Undecidable conditions (unbound variables) fail closed with a warning.
 * @returns {boolean} True when documented behavior holds.
 */
function testUndecidableFailsClosed() {
  clearTypedefs();
  const expect = expandType('K extends string ? number : boolean');
  const warnings = [];
  const ret = validateType(1, expect, 'loc', 'name', true, (...args) => warnings.push(args[0]), 0);
  if (ret !== false || !warnings.length) {
    return false;
  }
  return true;
}
/**
 * OverridesOf shape: template substitution decides the branch per call.
 * @returns {boolean} True when documented behavior holds.
 */
function testOverridesOf() {
  clearTypedefs();
  registerTypedef('Overrides', {type: 'object', properties: {a: {type: 'object', properties: {x: 'number'}}}});
  const expect = () => expandType('K extends keyof Overrides ? Overrides[K] : {}');
  if (!inspectTypeWithTemplates({x: 1}, expect(), 'loc', 'name', {K: '"a"'})) {
    return false;
  }
  if (!inspectTypeWithTemplates({anything: 1}, expect(), 'loc', 'name', {K: '"b"'})) {
    return false;
  }
  if (inspectTypeWithTemplates({x: 'nope'}, expect(), 'loc', 'name', {K: '"a"'})) {
    return false;
  }
  return true;
}
/**
 * Template literal targets: single interpolation decides literally.
 * @returns {boolean} True when documented behavior holds.
 */
function testTemplateTarget() {
  clearTypedefs();
  if (!validateType(1, expandType('`_x` extends `_${string}` ? number : boolean'), 'loc', 'name', true, warn, 0)) { // eslint-disable-line no-template-curly-in-string
    return false;
  }
  if (validateType(1, expandType('`x` extends `_${string}` ? number : boolean'), 'loc', 'name', true, warn, 0)) { // eslint-disable-line no-template-curly-in-string
    return false;
  }
  if (!validateType('s', expandType('"ab" extends `a${"b"}` ? string : number'), 'loc', 'name', true, warn, 0)) { // eslint-disable-line no-template-curly-in-string
    return false;
  }
  return true;
}
export const tests = [
  testTrueBranch,
  testFalseBranch,
  testUndecidableFailsClosed,
  testTemplateTarget,
  testOverridesOf,
];
