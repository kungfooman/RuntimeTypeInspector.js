import {overloadSignature} from './overloadSignature.js';
import {overloadToTuple} from './overloadToTuple.js';
import {expandType} from './expandType.js';

// A signature record keeps its tuple and template bindings.
function testSignatureKeepsParts() {
  const section = '@param {number} value';
  const tuple = overloadToTuple(section, expandType);
  const templates = {T: 'number'};
  const actual = overloadSignature(tuple, templates);
  const keepsTuple = actual.tuple === tuple;
  const keepsTemplates = actual.templates === templates;
  return (
    keepsTuple &&
    keepsTemplates
  );
}

export const tests = [testSignatureKeepsParts];
