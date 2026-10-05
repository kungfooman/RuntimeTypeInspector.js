import {validateType} from './validateType.js';
import {expandType} from '../src-transpiler/expandType.js';
import {classes} from './registerClass.js';
const silent = () => undefined;
function testKeyofGlobal() {
  // `keyof` over a platform constructor reflects instance keys: a real
  // method name passes, anything else fails.
  return validateType('getTime', expandType('keyof Date'), 'loc', 'key', true, silent, 0) === true &&
    validateType('nope', expandType('keyof Date'), 'loc', 'key', true, silent, 0) === false;
}
function testKeyofRegisteredClass() {
  // Registered classes resolve through the harvested chain, same as typedefs.
  class RtiKeyed {
    getA() {
      return 1;
    }
  }
  classes.RtiKeyed = RtiKeyed;
  try {
    return validateType('getA', expandType('keyof RtiKeyed'), 'loc', 'key', true, silent, 0) === true &&
      validateType('nope', expandType('keyof RtiKeyed'), 'loc', 'key', true, silent, 0) === false;
  } finally {
    delete classes.RtiKeyed;
  }
}
function testKeyofUnknownStaysClosed() {
  // Unresolvable names keep failing closed like before.
  return validateType('x', expandType('keyof Nope'), 'loc', 'key', true, silent, 0) === false;
}
export const tests = [
  testKeyofGlobal,
  testKeyofRegisteredClass,
  testKeyofUnknownStaysClosed,
];
