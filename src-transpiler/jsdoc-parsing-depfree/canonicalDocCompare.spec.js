import {canonicalDocEqual, canonicalDocCovers} from './canonicalDocCompare.js';
// Identical documents compare equal regardless of key order.
function testEqualIgnoresKeyOrder() {
  const first = {
    templates: [],
    overloads: [],
    params: [{name: 'x', bracketed: false, type: 'number', dropped: false, merged: false}],
    returns: '',
    callbacks: [],
  };
  const second = {
    callbacks: [],
    returns: '',
    params: [{merged: false, dropped: false, type: 'number', bracketed: false, name: 'x'}],
    overloads: [],
    templates: [],
  };
  return canonicalDocEqual(first, second) === true;
}
// Different row types compare unequal.
function testUnequalTypesFail() {
  const first = {
    templates: [],
    overloads: [],
    params: [{name: 'x', bracketed: false, type: 'number', dropped: false, merged: false}],
    returns: '',
    callbacks: [],
  };
  const second = {
    templates: [],
    overloads: [],
    params: [{name: 'x', bracketed: false, type: 'string', dropped: false, merged: false}],
    returns: '',
    callbacks: [],
  };
  return canonicalDocEqual(first, second) === false;
}
// A merged container plus its re-sliced children covers the TS rows:
// containers compare names and brackets only, children whole.
function testMergedContainerCoversChildren() {
  const actual = {
    templates: [],
    overloads: [],
    params: [{name: 'options', bracketed: false, type: 'object', dropped: false, merged: false}, {
      name: 'options.maxRetries',
      bracketed: true,
      type: 'number',
      dropped: false,
      merged: false,
    }],
    returns: '',
    callbacks: [],
  };
  const expected = {
    templates: [],
    overloads: [],
    params: [{name: 'options', bracketed: false, type: '', dropped: false, merged: true}, {
      name: 'options.maxRetries',
      bracketed: true,
      type: 'number',
      dropped: false,
      merged: false,
    }],
    returns: '',
    callbacks: [],
  };
  return canonicalDocCovers(actual, expected) === true;
}
// A misnamed child fails coverage: the sub-row name is load-bearing.
function testRenamedChildFailsCoverage() {
  const actual = {
    templates: [],
    overloads: [],
    params: [{name: 'options', bracketed: false, type: 'object', dropped: false, merged: false}, {
      name: 'options.retry',
      bracketed: true,
      type: 'number',
      dropped: false,
      merged: false,
    }],
    returns: '',
    callbacks: [],
  };
  const expected = {
    templates: [],
    overloads: [],
    params: [{name: 'options', bracketed: false, type: '', dropped: false, merged: true}, {
      name: 'options.maxRetries',
      bracketed: true,
      type: 'number',
      dropped: false,
      merged: false,
    }],
    returns: '',
    callbacks: [],
  };
  return canonicalDocCovers(actual, expected) === false;
}
export const tests = [testEqualIgnoresKeyOrder, testUnequalTypesFail, testMergedContainerCoversChildren, testRenamedChildFailsCoverage];
