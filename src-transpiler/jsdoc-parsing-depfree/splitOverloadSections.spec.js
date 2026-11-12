import {splitOverloadSections} from './splitOverloadSections.js';
import {deepEqualType} from '../../src-runtime/deepEqualType.js';
// Stacked blocks preserve the implementation separately from the signatures.
function testStackedSections() {
  const blocks = ['@overload @param {number} x', '@overload @param {string} x', '@param {any} x'];
  const actual = splitOverloadSections(blocks);
  const expected = {
    overloads: [' @param {number} x', ' @param {string} x'],
    impl: '@param {any} x',
    preMarker: '',
  };
  return deepEqualType(actual, expected);
}
// Return tags separate a single block's overloads from its implementation tail.
function testSingleBlockSections() {
  const src = `@overload
    @param {number} x
    @returns {number}
    @overload
    @param {string} x
    @returns {string}
    @param {any} x`;
  const result = splitOverloadSections([src]);
  return (
    result.overloads.length === 2 &&
    result.overloads[0].includes('{number}') &&
    result.overloads[1].includes('{string}') &&
    result.impl.includes('{any}')
  );
}
// A section-breaking marker (`@callback`/`@type`) terminates the section:
// the break text belongs to the tail, never to the entry — exactly like
// tsc, where the marker parses as its own tag. A head with no rows still
// lowers the empty entry for the lone marker.
function testBreakingMarkerSplitsTail() {
  const actual = splitOverloadSections(['@overload\n@param {number} x\n@callback Cb\n@param {string} y\n@returns {void}']);
  return (
    actual.overloads.length === 1 &&
    actual.overloads[0].includes('{number}') &&
    actual.impl.includes('@callback Cb')
  );
}
// A template-first part stalls before any row: tsc emits the empty marker
// and strands the rows, so the stranded part routes to the tail with an
// empty entry standing in.
function testTemplateFirstStalls() {
  const actual = splitOverloadSections(['@overload\n@template K\n@param {K} a\n@returns {K}']);
  return (
    actual.overloads.length === 1 &&
    actual.overloads[0] === '' &&
    actual.impl.includes('@param {K} a')
  );
}
// A template after rows rode the same marker that holds them (one span,
// errors included): the piece stays whole so the entry absorbs it exactly
// as tsc parses it.
function testTemplateAfterRowsAbsorbs() {
  const actual = splitOverloadSections(['@overload\n@param {T} x\n@template T\n@returns {T}']);
  return (
    actual.overloads.length === 1 &&
    actual.overloads[0].includes('@param {T} x') &&
    actual.overloads[0].includes('@template T') &&
    (actual.impl === null || actual.impl === '')
  );
}
// A template before the marker is flat scope, never section content: the
// split returns it separately so the fold can scope every section under
// it without splicing text into any section.
function testPreMarkerTemplateStaysOut() {
  const actual = splitOverloadSections(['@template T\n@overload\n@param {T} x\n@returns {T}']);
  return (
    actual.overloads.length === 1 &&
    actual.overloads[0].includes('@param {T} x') &&
    actual.overloads[0].includes('@template') === false &&
    actual.preMarker.includes('@template T')
  );
}
export const tests = [testStackedSections, testSingleBlockSections, testBreakingMarkerSplitsTail, testTemplateFirstStalls, testTemplateAfterRowsAbsorbs, testPreMarkerTemplateStaysOut];
