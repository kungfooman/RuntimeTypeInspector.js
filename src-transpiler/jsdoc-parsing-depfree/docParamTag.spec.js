import {makeParamTag} from './makeParamTag.js';
import {docParamTag} from './docParamTag.js';

// A plain tag lowers to a bound flat row: validated name, brace text, no flags.
function testPlainTagBindsFlat() {
  const row = docParamTag(makeParamTag('number', 'x'), 'number');
  return (
    row.name === 'x' &&
    row.bracketed === false &&
    row.type === 'number' &&
    row.dropped === false &&
    row.merged === false
  );
}

// A bracketed name marks the row bracketed while the bind name strips the brackets.
function testBracketedTagMarksBracketed() {
  const row = docParamTag(makeParamTag('number', '[opt=1] rest'), 'number');
  return row.name === 'opt' && row.bracketed === true && row.dropped === false;
}

// A misplaced rest marker binds nothing: the row carries the raw head as
// diagnostics and drops, matching tsc which rejects the spelling.
function testInvalidRestDrops() {
  const row = docParamTag(makeParamTag('number[]', '...values'), 'number[]');
  return row.dropped === true && row.name === '...values';
}

// A head the grammar rejects binds nothing: the row drops with an empty
// name, matching tsc which reads it as empty.
function testRejectedHeadDropsEmpty() {
  const row = docParamTag(makeParamTag('number', '*value'), 'number');
  return row.dropped === true && row.name === '';
}

export const tests = [
  testPlainTagBindsFlat,
  testBracketedTagMarksBracketed,
  testInvalidRestDrops,
  testRejectedHeadDropsEmpty,
];
