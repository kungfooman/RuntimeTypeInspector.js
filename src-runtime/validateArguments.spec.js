import {validateType} from './validateType.js';
const warn = () => undefined;
/**
 * @param {...any} args - The arguments.
 * @returns {IArguments} The raw arguments object.
 */
function captureArgs(...args) {
  return arguments;
}
function testArgumentsObjectPasses() {
  // A real `arguments` object carries an iterator and passes.
  return validateType(captureArgs(1, 2, 3), 'IArguments', 'loc', 'name', true, warn, 0) === true;
}
function testArrayPasses() {
  // Arrays iterate too, so they satisfy the check like before.
  return validateType([1, 2, 3], 'IArguments', 'loc', 'name', true, warn, 0) === true;
}
function testNullFailsWithoutThrowing() {
  // Nullish values fail closed instead of throwing on the property read.
  return validateType(null, 'IArguments', 'loc', 'name', true, warn, 0) === false &&
    validateType(undefined, 'IArguments', 'loc', 'name', true, warn, 0) === false;
}
function testNonIterableFails() {
  // Values without an iterator fail.
  return validateType({}, 'IArguments', 'loc', 'name', true, warn, 0) === false &&
    validateType(42, 'IArguments', 'loc', 'name', true, warn, 0) === false;
}
const tests = [
  testArgumentsObjectPasses,
  testArrayPasses,
  testNullFailsWithoutThrowing,
  testNonIterableFails,
];
export {tests};
