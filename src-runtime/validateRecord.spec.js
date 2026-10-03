import {validateType} from './validateType.js';
import {registerTypedef} from './registerTypedef.js';
import {expandType} from '../src-transpiler/expandType.js';
const warn = () => undefined;
function testStringRecordPasses() {
  // Exact string-keyed records pass.
  const expect = expandType('Record<string, number>');
  return validateType({a: 1}, expect, 'loc', 'name', true, warn, 0) === true;
}
function testStringRecordRejectsValues() {
  // Wrong member values fail.
  const expect = expandType('Record<string, number>');
  return validateType({a: 'x'}, expect, 'loc', 'name', true, warn, 0) === false;
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
  return validateType({0: 'a', 2: 'b'}, expect, 'loc', 'name', true, warn, 0) === true;
}
function testNumberRecordRejectsNamedKeys() {
  // Non-numeric keys fail a numeric index signature.
  const expect = expandType('Record<number, string>');
  return validateType({a: 'x'}, expect, 'loc', 'name', true, warn, 0) === false;
}
function testNumberRecordRejectsValues() {
  // Values still validate under numeric keys.
  const expect = expandType('Record<number, string>');
  return validateType({0: 1}, expect, 'loc', 'name', true, warn, 0) === false;
}
function testUnionKeysValidate() {
  // Union keys check each runtime key: members pass, others fail.
  const expect = expandType('Record<"admin" | "user", boolean>');
  return validateType({admin: true}, expect, 'loc', 'name', true, warn, 0) === true &&
    validateType({admin: true, root: false}, expect, 'loc', 'name', true, warn, 0) === false;
}
function testTypedefKeysValidate() {
  // Typedef keys resolve through the registry (the `Role` pattern).
  registerTypedef('Role', expandType('"admin" | "user" | "guest"'));
  const expect = expandType('Record<Role, boolean>');
  return validateType({admin: true, guest: false}, expect, 'loc', 'name', true, warn, 0) === true &&
    validateType({admin: true, root: false}, expect, 'loc', 'name', true, warn, 0) === false;
}
function testLiteralKeyValidates() {
  // String literal keys match exactly.
  const expect = expandType('Record<"a", number>');
  return validateType({a: 1}, expect, 'loc', 'name', true, warn, 0) === true &&
    validateType({b: 1}, expect, 'loc', 'name', true, warn, 0) === false;
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
