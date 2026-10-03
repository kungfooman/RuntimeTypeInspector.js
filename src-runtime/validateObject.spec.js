import {validateType} from './validateType.js';
import {validators} from './validators.js';
const warn = () => undefined;
function shape(props) {
  return {type: 'object', properties: props};
}
function testShapedPasses() {
  // Exact-shape objects pass.
  return validateType({a: 1}, shape({a: 'number'}), 'loc', 'name', true, warn, 0) === true;
}
function testShapedFails() {
  // Wrong member types fail with a pinned element message.
  const warnings = [];
  const ret = validateType({a: 'x'}, shape({a: 'number'}), 'loc', 'name', true, (...args) => warnings.push(args[0]), 0);
  return ret === false && warnings.length > 0;
}
function testBareAcceptsAllNonNullish() {
  // Bare `{}`/`object` accepts every non-nullish value, like TS.
  const bare = {type: 'object'};
  return validateType(1, bare, 'loc', 'name', true, warn, 0) === true &&
    validateType('x', bare, 'loc', 'name', true, warn, 0) === true &&
    validateType({}, bare, 'loc', 'name', true, warn, 0) === true &&
    validateType([], bare, 'loc', 'name', true, warn, 0) === true;
}
function testBareNullishFailsWithDiagnostic() {
  // Nullish values fail with the object diagnostic, not silently.
  const warnings = [];
  const bare = {type: 'object'};
  const retNull = validateType(null, bare, 'loc', 'name', true, (...args) => warnings.push(args[0]), 0);
  const retUndef = validateType(undefined, bare, 'loc', 'name', true, (...args) => warnings.push(args[0]), 0);
  return retNull === false && retUndef === false && warnings.length === 2 &&
    warnings.every((_) => typeof _ === 'string' && _.includes('not an object'));
}
function testStaleDirectCallFailsLoud() {
  // A bare properties bag means a stale direct call under the old
  // contract: fail loudly instead of misreading it as a shape.
  const warnings = [];
  const ret = validators.validateObject({a: 1}, {a: 'number'}, 'loc', 'name', true, (...args) => warnings.push(args[0]), 0);
  return ret === false && warnings.includes('unchecked');
}
const tests = [
  testShapedPasses,
  testShapedFails,
  testBareAcceptsAllNonNullish,
  testBareNullishFailsWithDiagnostic,
  testStaleDirectCallFailsLoud,
];
export {tests};
