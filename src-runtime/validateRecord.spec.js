import {validateType   } from './validateType.js';
import {registerTypedef} from './registerTypedef.js';
import {expandType     } from '../src-transpiler/expandType.js';
const warn = () => undefined;
function testStringRecordPasses() {
  // Exact string-keyed records pass.
  const expect = expandType('Record<string, number>');
  const value = {
    a: 1,
  };
  return validateType(value, expect, 'loc', 'name', true, warn, 0) === true;
}
function testStringRecordRejectsValues() {
  // Wrong member values fail.
  const expect = expandType('Record<string, number>');
  const value = {
    a: 'x',
  };
  return validateType(value, expect, 'loc', 'name', true, warn, 0) === false;
}
function testNullFailsWithoutThrowing() {
  // Nullish values fail closed instead of throwing on `Object.keys`.
  return validateType(null, expandType('Record<string, number>'), 'loc', 'name', true, warn, 0) === false &&
    validateType(undefined, expandType('Record<string, number>'), 'loc', 'name', true, warn, 0) === false;
}
function testNumberRecordAcceptsNumericKeys() {
  // `Record<number, string>` accepts canonical numeric keys: at runtime
  // every object key is a string, so `'0'` passes like tsc accepts `0`.
  const expect = expandType('Record<number, string>');
  const value = {
    0: 'a',
    2: 'b',
  };
  return validateType(value, expect, 'loc', 'name', true, warn, 0) === true;
}
function testNumberRecordRejectsNamedKeys() {
  // Non-numeric keys fail a numeric index signature.
  const expect = expandType('Record<number, string>');
  const value = {
    a: 'x',
  };
  return validateType(value, expect, 'loc', 'name', true, warn, 0) === false;
}
function testNumberRecordRejectsValues() {
  // Values still validate under numeric keys.
  const expect = expandType('Record<number, string>');
  const value = {
    0: 1,
  };
  return validateType(value, expect, 'loc', 'name', true, warn, 0) === false;
}
function testUnionKeysValidate() {
  // Union keys check each runtime key: members pass, others fail.
  const expect = expandType('Record<"admin" | "user", boolean>');
  const member = {
    admin: true,
  };
  const stranger = {
    admin: true,
    root: false,
  };
  return validateType(member, expect, 'loc', 'name', true, warn, 0) === true &&
    validateType(stranger, expect, 'loc', 'name', true, warn, 0) === false;
}
function testTypedefKeysValidate() {
  // Typedef keys resolve through the registry (the `Role` pattern).
  registerTypedef('Role', expandType('"admin" | "user" | "guest"'));
  const expect = expandType('Record<Role, boolean>');
  const member = {
    admin: true,
    guest: false,
  };
  const stranger = {
    admin: true,
    root: false,
  };
  return validateType(member, expect, 'loc', 'name', true, warn, 0) === true &&
    validateType(stranger, expect, 'loc', 'name', true, warn, 0) === false;
}
function testLiteralKeyValidates() {
  // String literal keys match exactly.
  const expect = expandType('Record<"a", number>');
  const hit = {
    a: 1,
  };
  const miss = {
    b: 1,
  };
  return validateType(hit, expect, 'loc', 'name', true, warn, 0) === true &&
    validateType(miss, expect, 'loc', 'name', true, warn, 0) === false;
}
const tests = [
  testStringRecordPasses,
  testStringRecordRejectsValues,
  testNullFailsWithoutThrowing,
  testNumberRecordAcceptsNumericKeys,
  testNumberRecordRejectsNamedKeys,
  testNumberRecordRejectsValues,
  testUnionKeysValidate,
  testTypedefKeysValidate,
  testLiteralKeyValidates,
];
export {tests};
