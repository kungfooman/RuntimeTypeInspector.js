import {canonicalDocRoundTrip} from './canonicalDocRoundTrip.js';
// A canonical doc survives JSON serialization structurally intact: no
// positions, no TS nodes, only plain data. Both readers must produce
// exactly this, so the round trip is pinned here, not per reader.
function testRoundTripPreservesDocument() {
  const doc = {
    templates: [{name: 'K', constraint: '', default: ''}],
    overloads: [{
      params: [{name: 'x', bracketed: false, type: 'number', dropped: false, merged: false}],
      returns: 'string',
    }],
    params: [{name: 'options', bracketed: false, type: '', dropped: false, merged: true}],
    returns: '',
    callbacks: [{
      name: 'Swap',
      params: [{name: 'state', bracketed: false, type: 'Object', dropped: false, merged: false}],
    }],
  };
  return canonicalDocRoundTrip(doc);
}
export const tests = [testRoundTripPreservesDocument];
