import {parseNamePath, parseBracketName} from './parseNamePath.js';
import {makeJSDocCursor} from './makeJSDocCursor.js';

/**
 * Reads one `@param` head into its name and optionality, like tsc's
 * `parseParameterOrPropertyTag`: an optional bracketed name (with its
 * default consumed and discarded), else the head word, then trailing
 * prose falls away. Token consumption replaces the old whole-head string
 * scan: brackets, words, dots, and `=` are already tokens, so the name is
 * a token run and the default never leaks into it. One grammar for the
 * whole tag layer: `makeParamTag` and `foldParam` both read through here,
 * so the gate and the fold can never disagree about what the name is.
 * @example
 * parseParamHead('[kwargs={}] rest');
 * // {name: 'kwargs', optional: true, segments: [{name: 'kwargs', array: false}], valid: true}
 * @example
 * parseParamHead('*value');
 * // {name: '', optional: false, segments: [], valid: false}
 * @param {string} headRaw - The text after the braces.
 * @returns {{name: string, optional: boolean, segments: {name: string, array: boolean}[], valid: boolean}} Stripped name, bracket flag, and path scan.
 */
function parseParamHead(headRaw) {
  // A leading `...` is the misplaced-rest spelling, not a path: keep the
  // head word for the caller's invalidRest flag instead of scanning it.
  const trimmed = headRaw.trim();
  if (trimmed.startsWith('...')) {
    return {name: trimmed.split(/\s+/)[0] ?? '', optional: false, segments: [], valid: true};
  }
  const cursor = makeJSDocCursor(trimmed);
  const bracketed = parseBracketName(cursor);
  if (cursor.tokens[cursor.index].kind === 'lbracket' || bracketed.next !== cursor.index) {
    const {segments, valid} = parseNamePath(bracketed.name);
    if (valid === false) {
      return {name: '', optional: true, segments: [], valid: false};
    }
    return {name: bracketed.name, optional: true, segments, valid: true};
  }
  // Bare head: the token run up to the first stop (space, newline, tag
  // mention, comment end). Words, dots, and bracket groups join; anything
  // else (like stray `-`) rides the run so validation sees it whole and
  // fails closed instead of binding a prefix. Leading furniture (`*value`
  // lexes as stars + word) binds nothing: a real name never starts with
  // `*`, matching tsc's empty name.
  let i = cursor.index;
  if (cursor.tokens[i].kind === 'stars') {
    return {name: '', optional: false, segments: [], valid: false};
  }
  let run = '';
  while (i < cursor.tokens.length) {
    const token = cursor.tokens[i];
    if (token.kind === 'word' || token.kind === 'dots' || token.kind === 'lbracket' || token.kind === 'rbracket' || token.kind === 'punct') {
      run += token.value;
      i += 1;
      continue;
    }
    break;
  }
  const head = run.split('=')[0].trim();
  const {segments, valid} = parseNamePath(head);
  if (valid === false) {
    return {name: '', optional: false, segments: [], valid: false};
  }
  return {name: head, optional: false, segments, valid: true};
}
export {parseParamHead};
