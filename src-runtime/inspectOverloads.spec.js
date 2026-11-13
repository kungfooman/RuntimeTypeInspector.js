import {inspectOverloads} from './inspectOverloads.js';
import {expandType      } from '../src-transpiler/expandType.js';
// A matching later overload accepts the entire argument list after a failed trial.
function testLaterSignatureMatches() {
  const numbers = expandType('[number, number]');
  const strings = expandType('[string]');
  const signatures = [{
    tuple: numbers,
  }, {
    tuple: strings,
  }];
  return inspectOverloads(['ok'], signatures, 'overloadSpec', 'arguments');
}
// A call mixing positions from different signatures fails as a whole.
function testMixedSignaturesFail() {
  const numbers = expandType('[number, number]');
  const strings = expandType('[string]');
  const signatures = [{
    tuple: numbers,
  }, {
    tuple: strings,
  }];
  return !inspectOverloads(['bad', 1], signatures, 'overloadMixedSpec', 'arguments');
}
export const tests = [testLaterSignatureMatches, testMixedSignaturesFail];
