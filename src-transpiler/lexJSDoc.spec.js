import {lexJSDoc} from './lexJSDoc.js';

// The lexer emits only structure: known-tag candidates, unknown `@word`
// mentions, brace positions, comment-end closers, and newlines. Trivia
// (stars, slashes, prose) is skipped, so the parser sees positions only.
function testLexEmitsStructure() {
  const tokens = lexJSDoc('@param {number} x');
  const kinds = tokens.map((token) => token.kind);
  return (
    tokens[0].kind === 'tag' &&
    tokens[0].value === '@param' &&
    kinds.includes('lbrace') &&
    kinds.includes('rbrace') &&
    tokens[tokens.length - 1].kind === 'eof'
  );
}

// Unknown `@word` mentions are tokens too: the parser needs them as head
// stops, so `@unknown` splits rows instead of merging into prose.
function testLexKeepsUnknownMentions() {
  const tokens = lexJSDoc('@param {number} a @unknown foo');
  return tokens.some((token) => token.kind === 'at' && token.value === '@unknown');
}

// Maximal munch on word chars: `@parametric` is prose, not `@param` plus
// junk, mirroring the legacy `(?![\w$])` tag boundary.
function testLexMaximalMunch() {
  const tokens = lexJSDoc('@parametric {number} x');
  return tokens.every((token) => token.kind !== 'tag');
}

// Every structural closer is a token: the parser cuts heads at `end`
// and balances braces from `lbrace`/`rbrace` positions alone.
function testLexEmitsClosers() {
  const tokens = lexJSDoc('/* @callback Foo */');
  return (
    tokens.some((token) => token.kind === 'end') &&
    tokens.some((token) => token.kind === 'tag' && token.value === '@callback')
  );
}

// The tag-open rule lives in the lexer: furniture-only lines and
// `@overload` followers open, mid-line prose mentions never do.
function testLexDecidesOpens() {
  const furniture = lexJSDoc('* @param {number} x').find((token) => token.kind === 'tag');
  const prose = lexJSDoc('* call foo(@param bar)').find((token) => token.kind === 'tag');
  const overload = lexJSDoc('@overload @param {number} v').filter((token) => token.kind === 'tag')[1];
  return furniture.opens === true && prose.opens === false && overload.opens === true;
}

// Trivia rides the stream: spaces and stars are tokens the parser skips
// positionally, so adjacency stays decidable without re-slicing source.
function testLexEmitsTrivia() {
  const kinds = lexJSDoc('* @param {number} x').map((token) => token.kind);
  return kinds.includes('space') && kinds.includes('stars');
}

export const tests = [
  testLexEmitsStructure,
  testLexKeepsUnknownMentions,
  testLexMaximalMunch,
  testLexEmitsClosers,
  testLexDecidesOpens,
  testLexEmitsTrivia,
];
