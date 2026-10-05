import {validateType} from './validateType.js';
import {customValidations} from './customValidations.js';
import {validateNumberInObject} from './validateNumberInObject.js';
const silent = () => undefined;
function testNumberInObjectBypassesCustomValidations() {
  // The PlayCanvas validator body only calls `validateNumberInObject`, which delegates
  // straight to `validateNumber` (depth 0) instead of `validateType`, so registered
  // custom validators are never re-entered by the body itself. Pin that safe shape.
  let calls = 0;
  const counter = () => {
    calls++;
    return true;
  };
  customValidations.push(counter);
  try {
    const ret = validateNumberInObject({x: 1}, 'x', silent);
    return ret === true && calls === 0;
  } finally {
    customValidations.length = 0;
  }
}
function testInstrumentedValidatorReentersAndBreaksValidCheck() {
  // Hazard documentation: if a custom validator itself carries transpiled `inspectType`
  // prologue checks (what the backticked `@ignoreRTI` miss produces), every outer check
  // re-enters the validator via `validateType`, hits the depth guard, and a perfectly
  // valid `42:number` check fails spuriously. The call count proves the re-entry loop.
  let calls = 0;
  const instrumented = (value, expect, loc, name, critical, warn, depth) => {
    calls++;
    if (calls > 60) {
      throw new Error('runaway validator recursion');
    }
    return validateType(value, 'any', 'validate', 'value', true, silent, depth + 1);
  };
  customValidations.push(instrumented);
  try {
    const ret = validateType(42, 'number', 'someLoc', 'someArg', true, silent, 0);
    return calls > 1 && ret === false;
  } finally {
    customValidations.length = 0;
  }
}
function testValidatorRemovalRestoresBehavior() {
  // After the instrumented validator is unregistered the same valid check passes again,
  // proving the failure above came from validator re-entry and left no global state behind.
  const instrumented = (value, expect, loc, name, critical, warn, depth) => validateType(value, 'any', 'v', 'w', true, silent, depth + 1);
  customValidations.push(instrumented);
  customValidations.length = 0;
  return validateType(42, 'number', 'someLoc', 'someArg', true, silent, 0) === true;
}
export const tests = [
  testNumberInObjectBypassesCustomValidations,
  testInstrumentedValidatorReentersAndBreaksValidCheck,
  testValidatorRemovalRestoresBehavior,
];
