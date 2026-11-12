/**
 * Parses a dotted JSDoc parameter path into segments, like tsc's
 * `parseJSDocEntityName` (identifier, then `while (dot) identifier` into
 * nested names). A character scan, not a split: identifiers join on dots,
 * `[]` and `[digits]` groups glue onto the segment before them, and
 * anything else fails the whole path. Failing closed matters because the
 * old `split(/[\[\]]*\./)` bound mangled prefixes as real keys (`stats[0`
 * from `stats[0].x`).
 * @example
 * parseNamePath('options.stats[].unitsName');
 * // {segments: [{name: 'options', array: false}, {name: 'stats', array: true},
 * //  {name: 'unitsName', array: false}], valid: true}
 * @param {string} path - The head token after bracket and default stripping.
 * @returns {{segments: {name: string, array: boolean}[], valid: boolean}} Segments plus whether the path scanned clean.
 */
function parseNamePath(path) {
  const segments = [];
  const isIdentStart = (c) => c !== undefined && /[A-Za-z_$]/.test(c);
  const isIdentChar = (c) => c !== undefined && /[\w$]/.test(c);
  const isDigit = (c) => c !== undefined && /[0-9]/.test(c);
  let i = 0;
  while (true) {
    if (!isIdentStart(path[i])) {
      return {segments, valid: false};
    }
    let j = i + 1;
    while (isIdentChar(path[j])) {
      j += 1;
    }
    const name = path.slice(i, j);
    let array = false;
    while (path[j] === '[') {
      let k = j + 1;
      while (isDigit(path[k])) {
        k += 1;
      }
      if (path[k] !== ']') {
        return {segments, valid: false};
      }
      array = true;
      j = k + 1;
    }
    segments.push({name, array});
    if (j >= path.length) {
      return {segments, valid: true};
    }
    if (path[j] !== '.') {
      return {segments, valid: false};
    }
    i = j + 1;
  }
}
/**
 * Parses one bracketed `@param` name on the cursor, like tsc's
 * `parseBracketNameInPropertyAndParamTag`: optional `[`, optional default,
 * expect `]`. Token consumption replaces the old balanced-counter over raw
 * text: `[`, words, dots, and `]` are already tokens, so the name is the
 * token run between the brackets and the default is everything up to the
 * matching `]` (nested brackets balance by depth). Returns the head offset
 * after the closer.
 * @example
 * const cursor = makeJSDocCursor('[kwargs={}] rest');
 * cursor.index = 0;
 * parseBracketName(cursor);
 * // {name: 'kwargs', optional: true, next: 5}
 * @param {object} cursor - Cursor on the token where the name starts.
 * @param {string} cursor.src - The full JSDoc text (for slicing the name run).
 * @param {{kind: string, value?: string, pos: number, end?: number}[]} cursor.tokens - The token stream.
 * @param {number} cursor.index - Token index to read from.
 * @returns {{name: string, optional: boolean, next: number}} Name, bracket flag, index after the name.
 */
function parseBracketName(cursor) {
  if (cursor.tokens[cursor.index].kind !== 'lbracket') {
    return {name: '', optional: false, next: cursor.index};
  }
  let i = cursor.index + 1;
  let depth = 1;
  while (i < cursor.tokens.length) {
    const {kind} = cursor.tokens[i];
    if (kind === 'lbracket') {
      depth += 1;
    } else if (kind === 'rbracket') {
      depth -= 1;
      if (depth === 0) {
        break;
      }
    } else if (kind === 'eof' || kind === 'newline') {
      return {name: '', optional: false, next: cursor.index};
    }
    i += 1;
  }
  if (i >= cursor.tokens.length || cursor.tokens[i].kind !== 'rbracket') {
    return {name: '', optional: false, next: cursor.index};
  }
  // The name is the token run inside, like tsc's entity name: words join
  // on dots, `[]` groups glue onto the segment before them, and `=`
  // starts the default (consumed, discarded). The old whole-head string
  // scan moves here, onto tokens instead of text.
  const inner = cursor.tokens.slice(cursor.index + 1, i);
  const run = inner.map((token) => {
    const isWord = token.kind === 'word' || token.kind === 'dots' || token.kind === 'punct';
    const isBracket = token.kind === 'lbracket' || token.kind === 'rbracket';
    if (isWord || isBracket) {
      return token.value;
    }
    if (token.kind === 'equals') {
      return '=';
    }
    return '';
  }).join('');
  const head = run.split('=')[0].trim();
  const {segments, valid} = parseNamePath(head);
  if (valid === false) {
    return {name: '', optional: true, next: i + 1};
  }
  const render = (segment) => segment.name + (segment.array === true ? '[]' : '');
  const name = segments.map(render).join('.');
  return {name, optional: true, next: i + 1};
}
export {parseNamePath, parseBracketName};
