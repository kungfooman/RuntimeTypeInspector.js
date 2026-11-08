import {parseJSDoc} from './parseJSDoc.js';
import {parseJSDocDocument} from './parseJSDocDocument.js';

// One scan feeds every node at once: the same comment yields params,
// templates, and the setter together, so `@overload` sections never see
// params and templates disagree the way three scans could.
function testDocumentFeedsAllViews() {
  const doc = parseJSDocDocument('@template T @param {T} first @type {number}');
  return (
    doc.params?.first !== undefined &&
    doc.templates?.T !== undefined &&
    doc.setter !== undefined &&
    doc.tags.length === 1 &&
    doc.tags[0].typeRaw === 'T'
  );
}

// Same-line tags scan as one row each: the head never swallows a follower.
// Inline `@overload @param` rows stay visible; mid-line prose stays out.
function testLexerRules() {
  const same = parseJSDoc('@param {number} a @param {string} b');
  const inline = parseJSDoc('@overload @param {number} value');
  const prose = parseJSDoc('* call foo(@param bar) here');
  return (
    same?.a !== undefined &&
    same?.b !== undefined &&
    inline?.value !== undefined &&
    prose === undefined
  );
}

// Raw tags ride beside expanded params: the `...` marker the expansion
// erases survives on the tag for rest detection downstream.
function testTagsKeepRawBesideExpanded() {
  const doc = parseJSDocDocument('* @param {...number[]} values');
  return (
    doc.tags.length === 1 &&
    doc.tags[0].typeRaw === '...number[]' &&
    doc.tags[0].name === 'values' &&
    doc.params?.values?.type === 'array'
  );
}

// A rest marker before the name flags invalid and yields no params: the
// misspelled member drops before dotted-path folding ever sees it.
function testMisplacedRestFlagsInvalid() {
  const doc = parseJSDocDocument('* @param {number[]} ...values');
  const tag = doc.tags[0];
  return (
    doc.tags.length === 1 &&
    tag.invalidRest === true &&
    doc.params === undefined
  );
}

// Trailing prose stays out of the name; dotted names still fold into
// nested objects while the tag stays flat.
function testHeadsAndDottedNames() {
  const doc = parseJSDocDocument('* @param {...number[]} values trailing words here');
  const dotted = parseJSDocDocument('* @param {string} outputs.logits The logits');
  const tag = doc.tags[0];
  return (
    tag.name === 'values' &&
    tag.invalidRest === false &&
    dotted.tags[0].name === 'outputs.logits' &&
    dotted.params?.outputs !== undefined
  );
}

// Templates ride the document: a constrained default keeps the
// constraint, a bare name stands in as any, and bracket defaults expand
// under the name. Exactly one `@type` yields the setter; two yield none.
function testTemplatesAndSetter() {
  const constrained = parseJSDocDocument('@template {AssetType | (string & {})} [K=string]');
  const bare = parseJSDocDocument('@template K');
  const def = parseJSDocDocument('@template [K=string]');
  const one = parseJSDocDocument('* @type {number} ');
  const two = parseJSDocDocument('* @type {string} \n * @type {number}');
  return (
    constrained.templates?.K?.type === 'union' &&
    bare.templates?.K === 'any' &&
    def.templates?.K === 'string' &&
    one.setter === 'number' &&
    two.setter === undefined
  );
}

// Bracket defaults expand with optionality, like the legacy entry did.
function testBracketDefaultExpands() {
  const params = parseJSDoc('* @param {Object} [kwargs={}] Optional arguments.');
  return params?.kwargs !== undefined;
}

export const tests = [
  testDocumentFeedsAllViews,
  testLexerRules,
  testTagsKeepRawBesideExpanded,
  testMisplacedRestFlagsInvalid,
  testHeadsAndDottedNames,
  testTemplatesAndSetter,
  testBracketDefaultExpands,
];
