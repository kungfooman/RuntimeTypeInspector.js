import {overloadInspectionArgs} from './overloadInspectionArgs.js';
// An arrow inspection reads the stored wrapper call name.
function testArrowUsesStoredList() {
  const fallback = {
    type: 'ArrowFunctionExpression',
  };
  const wrapper = {
    callName: 'rtiOverloadStore',
  };
  const actual = overloadInspectionArgs({}, fallback, wrapper);
  return actual === 'rtiOverloadStore';
}
// A bare arrow inspection reads only the stored rest.
function testArrowWithoutWrapper() {
  const fallback = {
    type: 'ArrowFunctionExpression',
  };
  const fnNode = {
    rtiOverloadArguments: 'rtiArgs',
  };
  const actual = overloadInspectionArgs(fnNode, fallback);
  return actual === '[...rtiArgs]';
}
// Any other function keeps the legacy arguments list.
function testOtherUsesArguments() {
  const fallback = {
    type: 'FunctionDeclaration',
  };
  return overloadInspectionArgs(null, fallback) === '[...arguments]';
}
export const tests = [testArrowUsesStoredList, testArrowWithoutWrapper, testOtherUsesArguments];
