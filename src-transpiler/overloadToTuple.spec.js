import {overloadToTuple} from './overloadToTuple.js';
import {deepEqualType  } from '../src-runtime/deepEqualType.js';
// Optional names retain their position and permit omission.
function testOptionalMember() {
  const actual = overloadToTuple('@param {number} [x]');
  const expected = {
    type: 'tuple',
    elements: [{
      type: 'tupleMember',
      name: 'x',
      elementType: {
        type: 'atom',
        atomType: 'number',
      },
      optional: true,
    }],
  };
  return deepEqualType(actual, expected);
}
// An array after the rest marker supplies the variadic element type.
function testRestMember() {
  const actual = overloadToTuple('@param {...number[]} values');
  const expected = {
    type: 'tuple',
    elements: [{
      type: 'tupleMember',
      name: 'values',
      elementType: {
        type: 'array',
        elementType: 'number',
      },
      dotDot: true,
    }],
  };
  return deepEqualType(actual, expected);
}
// A bare rest marker gathers into the element itself (`...number`).
function testBareRestMember() {
  const actual = overloadToTuple('@param {...number} values');
  const expected = {
    type: 'tuple',
    elements: [{
      type: 'tupleMember',
      name: 'values',
      elementType: 'number',
      dotDot: true,
    }],
  };
  return deepEqualType(actual, expected);
}
// An optional rest marker is the TS2370 error: no value validates.
function testOptionalRestRejects() {
  const actual = overloadToTuple('@param {...number[]} [values]');
  const expected = {
    type: 'tuple',
    elements: [{
      type: 'tupleMember',
      name: 'values',
      elementType: 'never',
      optional: true,
    }],
  };
  return deepEqualType(actual, expected);
}
// A rest marker before the name is the TS1003 error: the member drops.
function testMisplacedRestDrops() {
  const actual = overloadToTuple('@param {number[]} ...values');
  const expected = {
    type: 'tuple',
    elements: [],
  };
  return deepEqualType(actual, expected);
}
export const tests = [testOptionalMember, testRestMember, testBareRestMember, testOptionalRestRejects, testMisplacedRestDrops];
