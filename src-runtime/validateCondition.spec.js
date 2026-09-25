import {validateType} from './validateType.js';
import {evaluateCondition} from './evaluateCondition.js';
import {inspectTypeWithTemplates} from './inspectTypeWithTemplates.js';
import {registerTypedef, typedefs} from './registerTypedef.js';
import {registerClass, classes} from './registerClass.js';
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
/**
 * Intersection targets decide by conjunction: every member must extend it.
 * @returns {boolean} True when documented behavior holds.
 */
function testIntersectionTarget() {
  clearTypedefs();
  if (evaluateCondition('"a"', expandType('string & {}'), warn) !== undefined) {
    // `{}` is not resolvable here: undecidable, not false.
    return false;
  }
  const expect = expandType('"a" extends string & ("a" | "b") ? number : boolean');
  if (!validateType(1, expect, 'loc', 'name', true, warn, 0)) {
    return false;
  }
  if (validateType(1, expandType('"c" extends string & ("a" | "b") ? number : boolean'), 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
/**
 * Intersection checks decide by disjunction: either member suffices.
 * @returns {boolean} True when documented behavior holds.
 */
function testIntersectionCheck() {
  clearTypedefs();
  if (!validateType(1, expandType('("a" & string) extends string ? number : boolean'), 'loc', 'name', true, warn, 0)) {
    return false;
  }
  return true;
}
/**
 * `keyof` targets read key names first: literals match their keys.
 * @returns {boolean} True when documented behavior holds.
 */
function testKeyofTarget() {
  clearTypedefs();
  registerTypedef('Box', {type: 'object', properties: {a: 'number', b: 'string'}});
  if (evaluateCondition('"a"', expandType('keyof Box'), warn) !== true) {
    return false;
  }
  if (evaluateCondition('"z"', expandType('keyof Box'), warn) !== false) {
    return false;
  }
  return true;
}
/**
 * Engine-shaped `ComponentName` condition: `"render" extends
 * keyof ComponentMap & string` decides true through the remapped mapping,
 * non-components decide false. Unique class names avoid the shared registry.
 * @returns {boolean} True when documented behavior holds.
 */
function testComponentNameCondition() {
  clearTypedefs();
  class CondComponent {}
  class CondRender extends CondComponent {}
  class CondLight extends CondComponent {}
  registerClass(CondComponent);
  registerClass(CondRender);
  registerClass(CondLight);
  registerTypedef('CondEntity', {type: 'object', properties: {render: 'CondRender', light: 'CondLight', name: 'string'}});
  registerTypedef('CondMap', expandType('{[K in keyof CondEntity as NonNullable<CondEntity[K]> extends CondComponent ? K : never]: NonNullable<CondEntity[K]>}'));
  registerTypedef('CondName', expandType('keyof CondMap & string'));
  try {
    if (evaluateCondition('"render"', 'CondName', warn) !== true) {
      return false;
    }
    if (evaluateCondition('"name"', 'CondName', warn) !== false) {
      return false;
    }
    if (evaluateCondition('"nope"', 'CondName', warn) !== false) {
      return false;
    }
    if (evaluateCondition(42, 'CondName', warn) !== false) {
      return false;
    }
    return true;
  } finally {
    delete classes.CondComponent;
    delete classes.CondRender;
    delete classes.CondLight;
  }
}
export const tests = [
  testTrueBranch,
  testFalseBranch,
  testUndecidableFailsClosed,
  testTemplateTarget,
  testOverridesOf,
  testIntersectionTarget,
  testIntersectionCheck,
  testKeyofTarget,
  testComponentNameCondition,
];
