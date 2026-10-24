/**
 * @todo expandTypeDepFree doesn't support "complicated" types.
 * For actual builds, we use expandType() anyway (which is based on TypeScript).
 * But since TypeScript is a huge dependency, I'm looking into BabelFlow/BabelTypescript parser.
 * Comparing AST's like this usually helps to find bugs or potential issues,
 * while we can benchmark for best performance too.
 * @example
 * const tooComplex = 'Array<string|{chunks?: undefined|Array<{language: string|null, timestamp: Array<number|null>, text: string}>}>';
 * console.log(expandTypeDepFree(tooComplex));
 */
/** @import {ExpandedType, ExpandMappingNode, ExpandMappedRaw, ExpandTupleMemberNode, ExpandIndexSignatureNode, ExpandAnnotatedAtomNode, ExpandObjectNode} from './expandedType.js' */
/**
 * Splits a string by a delimiter, ignoring delimiters nested inside <>, {}, [], ().
 * Quote-aware: delimiters inside '...', "..." or `...` never split.
 * @param {string} str - The string to split.
 * @param {string} delimiter - Single character delimiter.
 * @returns {string[]} Top-level split parts.
 */
function splitTopLevel(str, delimiter) {
  const parts = [];
  let depthAngle = 0;
  let depthCurly = 0;
  let depthSquare = 0;
  let depthParen = 0;
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let current = '';
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    const prev = i > 0 ? str[i - 1] : '';
    if (c === "'" && !inDouble && !inBacktick && prev !== '\\') inSingle = !inSingle;
    else if (c === '"' && !inSingle && !inBacktick && prev !== '\\') inDouble = !inDouble;
    else if (c === '`' && !inSingle && !inDouble && prev !== '\\') inBacktick = !inBacktick;
    const inQuote = inSingle || inDouble || inBacktick;
    if (!inQuote) {
      if (c === '<') depthAngle++;
      else if (c === '>') depthAngle--;
      else if (c === '{') depthCurly++;
      else if (c === '}') depthCurly--;
      else if (c === '[') depthSquare++;
      else if (c === ']') depthSquare--;
      else if (c === '(') depthParen++;
      else if (c === ')') depthParen--;
    }
    if (c === delimiter && !inQuote && depthAngle === 0 && depthCurly === 0 && depthSquare === 0 && depthParen === 0) {
      parts.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  parts.push(current);
  return parts;
}
/**
 * Depth state at a given index, quote-aware.
 * @param {string} str - The string to scan.
 * @param {number} upto - Exclusive end index.
 * @returns {{angle: number, curly: number, square: number, paren: number, quote: boolean}} Depths.
 */
function depthsAt(str, upto) {
  let angle = 0;
  let curly = 0;
  let square = 0;
  let paren = 0;
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  for (let i = 0; i < upto; i++) {
    const c = str[i];
    const prev = i > 0 ? str[i - 1] : '';
    if (c === "'" && !inDouble && !inBacktick && prev !== '\\') inSingle = !inSingle;
    else if (c === '"' && !inSingle && !inBacktick && prev !== '\\') inDouble = !inDouble;
    else if (c === '`' && !inSingle && !inDouble && prev !== '\\') inBacktick = !inBacktick;
    const inQuote = inSingle || inDouble || inBacktick;
    if (inQuote) continue;
    if (c === '<') angle++;
    else if (c === '>') angle--;
    else if (c === '{') curly++;
    else if (c === '}') curly--;
    else if (c === '[') square++;
    else if (c === ']') square--;
    else if (c === '(') paren++;
    else if (c === ')') paren--;
  }
  return {angle, curly, square, paren, quote: inSingle || inDouble || inBacktick};
}
/**
 * Finds a keyword (e.g. `in`, `as`, `extends`) at top level, outside brackets/quotes.
 * @param {string} str - The string to search.
 * @param {string} keyword - Keyword without surrounding spaces.
 * @returns {number} Start index or -1.
 */
function findTopLevelKeyword(str, keyword) {
  const isWord = (/** @type {string} */ c) => /[A-Za-z0-9_$]/.test(c);
  for (let i = 0; i <= str.length - keyword.length; i++) {
    if (str.slice(i, i + keyword.length) !== keyword) continue;
    const before = i > 0 ? str[i - 1] : ' ';
    const after = i + keyword.length < str.length ? str[i + keyword.length] : ' ';
    if (isWord(before) || isWord(after)) continue;
    const d = depthsAt(str, i);
    if (d.angle === 0 && d.curly === 0 && d.square === 0 && d.paren === 0 && !d.quote) {
      // Ensure remainder after keyword is also top-level (keyword itself not quoted).
      const d2 = depthsAt(str, i + keyword.length);
      if (!d2.quote) return i;
    }
  }
  return -1;
}
/**
 * Finds a single-char delimiter at top level, outside brackets/quotes.
 * @param {string} str - The string to search.
 * @param {string} delimiter - Single character.
 * @param {number} from - Start index.
 * @returns {number} Index or -1.
 */
function findTopLevelChar(str, delimiter, from = 0) {
  let angle = 0;
  let curly = 0;
  let square = 0;
  let paren = 0;
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    // Check at depths *before* the current char, so `[` itself is findable.
    const inQuoteBefore = inSingle || inDouble || inBacktick;
    if (i >= from && c === delimiter && !inQuoteBefore && angle === 0 && curly === 0 && square === 0 && paren === 0) {
      return i;
    }
    const prev = i > 0 ? str[i - 1] : '';
    if (c === "'" && !inDouble && !inBacktick && prev !== '\\') inSingle = !inSingle;
    else if (c === '"' && !inSingle && !inBacktick && prev !== '\\') inDouble = !inDouble;
    else if (c === '`' && !inSingle && !inDouble && prev !== '\\') inBacktick = !inBacktick;
    const inQuote = inSingle || inDouble || inBacktick;
    if (!inQuote) {
      if (c === '<') angle++;
      else if (c === '>') angle--;
      else if (c === '{') curly++;
      else if (c === '}') curly--;
      else if (c === '[') square++;
      else if (c === ']') square--;
      else if (c === '(') paren++;
      else if (c === ')') paren--;
    }
  }
  return -1;
}
/**
 * Strips balanced outer parens, e.g. `(( T ))` -> `T`.
 * @param {string} type - Trimmed type string.
 * @returns {string} Unwrapped type.
 */
function stripOuterParens(type) {
  let changed = true;
  while (changed) {
    changed = false;
    if (type.length >= 2 && type[0] === '(' && type[type.length - 1] === ')') {
      let depth = 0;
      let balanced = true;
      let inSingle = false;
      let inDouble = false;
      for (let i = 0; i < type.length; i++) {
        const c = type[i];
        if (c === "'" && !inDouble && type[i - 1] !== '\\') inSingle = !inSingle;
        else if (c === '"' && !inSingle && type[i - 1] !== '\\') inDouble = !inDouble;
        else if (!inSingle && !inDouble) {
          if (c === '(') depth++;
          else if (c === ')') {
            depth--;
            if (depth === 0 && i !== type.length - 1) {
              balanced = false;
              break;
            }
          }
        }
      }
      if (balanced && depth === 0) {
        type = type.slice(1, -1).trim();
        changed = true;
      }
    }
  }
  return type;
}
/**
 * Parses `Name<A, B>` into name + raw arg strings, respecting nested brackets.
 * Returns undefined when input isn't a generic reference.
 * @param {string} type - Trimmed type string.
 * @returns {{name: string, args: string[]}|undefined} Parsed generic reference.
 */
function parseGenericReference(type) {
  const openIndex = type.indexOf('<');
  if (openIndex === -1 || !type.endsWith('>')) {
    return;
  }
  const name = type.slice(0, openIndex).trim();
  if (!/^[A-Za-z_$][A-Za-z0-9_$.]*$/.test(name)) {
    return;
  }
  // Find matching '>' for the first '<' to ensure outermost brackets wrap the whole type.
  let depth = 0;
  let closeIndex = -1;
  for (let i = openIndex; i < type.length; i++) {
    if (type[i] === '<') depth++;
    else if (type[i] === '>') {
      depth--;
      if (depth === 0) {
        closeIndex = i;
        break;
      }
    }
  }
  if (closeIndex !== type.length - 1) {
    return;
  }
  const inner = type.slice(openIndex + 1, closeIndex);
  const args = splitTopLevel(inner, ',').map((_) => _.trim()).filter((_) => _.length);
  if (!args.length) {
    return;
  }
  return {name, args};
}
/**
 * Parses `{[K in Iterable as NameType]?: Result}` mapped syntax.
 * Returns raw mapped type parts, before `iterable`/`result`/`nameType`
 * are expanded. Returns undefined when input isn't a mapped type.
 * @param {string} type - Trimmed type string starting with `{`.
 * @returns {ExpandMappedRaw | undefined} Mapping struct with raw strings, or undefined.
 */
function parseMappedRaw(type) {
  if (type[0] !== '{' || type[type.length - 1] !== '}') {
    return;
  }
  let inner = type.slice(1, -1).trim();
  /** @type {('-' | '+' | 'readonly') | undefined} */
  let readonly;
  if (inner.startsWith('-readonly') && (inner[9] === ' ' || inner[9] === '[')) {
    readonly = '-';
    inner = inner.slice(9).trim();
  } else if (inner.startsWith('+readonly') && (inner[9] === ' ' || inner[9] === '[')) {
    readonly = '+';
    inner = inner.slice(9).trim();
  } else if (inner.startsWith('readonly') && (inner[8] === ' ' || inner[8] === '[')) {
    readonly = 'readonly';
    inner = inner.slice(8).trim();
  }
  if (inner[0] !== '[') {
    return;
  }
  // Find matching `]` for the opening `[`, quote-aware.
  let square = 0;
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let close = -1;
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    const prev = i > 0 ? inner[i - 1] : '';
    if (c === "'" && !inDouble && !inBacktick && prev !== '\\') inSingle = !inSingle;
    else if (c === '"' && !inSingle && !inBacktick && prev !== '\\') inDouble = !inDouble;
    else if (c === '`' && !inSingle && !inDouble && prev !== '\\') inBacktick = !inBacktick;
    else if (!inSingle && !inDouble && !inBacktick) {
      if (c === '[') square++;
      else if (c === ']') {
        square--;
        if (square === 0) {
          close = i;
          break;
        }
      }
    }
  }
  if (close === -1) {
    return;
  }
  const bracket = inner.slice(1, close);
  let rest = inner.slice(close + 1).trim();
  /** @type {('-' | '+' | '?') | undefined} */
  let question;
  if (rest.startsWith('-?')) {
    question = '-';
    rest = rest.slice(2).trim();
  } else if (rest.startsWith('+?')) {
    question = '+';
    rest = rest.slice(2).trim();
  } else if (rest.startsWith('?')) {
    question = '?';
    rest = rest.slice(1).trim();
  }
  if (!rest.startsWith(':')) {
    return;
  }
  const resultRaw = rest.slice(1).trim();
  if (!resultRaw) {
    return;
  }
  const inIdx = findTopLevelKeyword(bracket, 'in');
  if (inIdx === -1) {
    return;
  }
  const element = bracket.slice(0, inIdx).trim();
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(element)) {
    return;
  }
  const afterIn = bracket.slice(inIdx + 2).trim();
  if (!afterIn) {
    return;
  }
  const asIdx = findTopLevelKeyword(afterIn, 'as');
  let iterableRaw = afterIn;
  let nameRaw;
  if (asIdx !== -1) {
    iterableRaw = afterIn.slice(0, asIdx).trim();
    nameRaw = afterIn.slice(asIdx + 2).trim();
    if (!iterableRaw || !nameRaw) {
      return;
    }
  }
  return {element, iterableRaw, nameRaw, resultRaw, question, readonly};
}
/**
 * Splits `Check extends Extends ? True : False` at top level.
 * Returns undefined when input isn't a conditional type.
 * @param {string} type - Trimmed type string.
 * @returns {{check: string, extends_: string, true_: string, false_: string} | undefined} Raw parts, or undefined when not a conditional.
 */
function parseConditionRaw(type) {
  const qIdx = findTopLevelChar(type, '?');
  if (qIdx === -1) {
    return;
  }
  const beforeQ = type.slice(0, qIdx);
  const afterQ = type.slice(qIdx + 1);
  const extIdx = findTopLevelKeyword(beforeQ, 'extends');
  if (extIdx === -1) {
    return;
  }
  const colonIdx = findTopLevelChar(afterQ, ':');
  if (colonIdx === -1) {
    return;
  }
  const check = beforeQ.slice(0, extIdx).trim();
  const extends_ = beforeQ.slice(extIdx + 7).trim();
  const true_ = afterQ.slice(0, colonIdx).trim();
  const false_ = afterQ.slice(colonIdx + 1).trim();
  if (!check || !extends_ || !true_ || !false_) {
    return;
  }
  // Guard against `?.` optional chaining and `??` nullish coalescing.
  if (type[qIdx + 1] === '.' || type[qIdx + 1] === '?') {
    return;
  }
  return {check, extends_, true_, false_};
}
/**
 * Splits `Object[Index]` at top level. Excludes tuples (`[...]`) and
 * empty-index arrays (`T[]`, handled earlier).
 * @param {string} type - Trimmed type string.
 * @returns {{objectRaw: string, indexRaw: string} | undefined} Raw parts, or undefined when not indexed access.
 */
function parseIndexedAccessRaw(type) {
  if (!type.endsWith(']') || type.endsWith('[]')) {
    return;
  }
  if (type[0] === '[') {
    return;
  }
  const openIdx = findTopLevelChar(type, '[');
  if (openIdx === -1) {
    return;
  }
  // Ensure the `[` at openIdx closes at the very end.
  let square = 0;
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  for (let i = openIdx; i < type.length; i++) {
    const c = type[i];
    const prev = i > 0 ? type[i - 1] : '';
    if (c === "'" && !inDouble && !inBacktick && prev !== '\\') inSingle = !inSingle;
    else if (c === '"' && !inSingle && !inBacktick && prev !== '\\') inDouble = !inDouble;
    else if (c === '`' && !inSingle && !inDouble && prev !== '\\') inBacktick = !inBacktick;
    else if (!inSingle && !inDouble && !inBacktick) {
      if (c === '[') square++;
      else if (c === ']') {
        square--;
        if (square === 0 && i !== type.length - 1) {
          return;
        }
      }
    }
  }
  if (square !== 0) {
    return;
  }
  const objectRaw = type.slice(0, openIdx).trim();
  const indexRaw = type.slice(openIdx + 1, -1).trim();
  if (!objectRaw || !indexRaw) {
    return;
  }
  return {objectRaw, indexRaw};
}
/**
 * Splits a raw function parameter list into `{type, name}` parameter nodes,
 * mirroring the TS parser's `Parameter` case. `...args: T[]` wraps like
 * `dotDotDotToken` does there.
 * @param {string} paramsRaw - The raw text between the parameter parens.
 * @returns {ExpandedType[] | undefined} Parameter nodes, or undefined when
 * the list does not parse.
 */
function parseFunctionParams(paramsRaw) {
  if (paramsRaw.trim() === '') {
    return [];
  }
  const parts = splitTopLevel(paramsRaw, ',');
  const parameters = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) {
      return;
    }
    if (trimmed.startsWith('...')) {
      const inner = trimmed.slice(3).trim();
      const colonIdx = findTopLevelChar(inner, ':');
      if (colonIdx === -1) {
        return;
      }
      const name = inner.slice(0, colonIdx).trim();
      const typeRaw = inner.slice(colonIdx + 1).trim();
      if (!name || !typeRaw) {
        return;
      }
      const innerParam = {type: expandTypeDepFree(typeRaw), name};
      parameters.push({type: 'array', elementType: innerParam});
      continue;
    }
    const colonIdx = findTopLevelChar(trimmed, ':');
    if (colonIdx === -1) {
      return;
    }
    const name = trimmed.slice(0, colonIdx).trim();
    // Strip `?` optional markers (`(a?: number)`), matching expandType().
    const cleanName = name.endsWith('?') ? name.slice(0, -1).trim() : name;
    const typeRaw = trimmed.slice(colonIdx + 1).trim();
    if (!cleanName || !typeRaw) {
      return;
    }
    parameters.push({type: expandTypeDepFree(typeRaw), name: cleanName});
  }
  return parameters;
}
/**
 * Splits `(params) => ret` and `new (params) => ret` at top level.
 * Returns undefined when input isn't a function type.
 * @param {string} type - Trimmed type string.
 * @returns {{paramsRaw: string, retRaw: string, isNew: boolean} | undefined} Raw parts.
 */
function parseFunctionRaw(type) {
  let rest = type;
  let isNew = false;
  if (rest.startsWith('new ')) {
    const after = rest.slice(4).trim();
    if (!after.startsWith('(')) {
      return;
    }
    isNew = true;
    rest = after;
  }
  if (!rest.startsWith('(')) {
    return;
  }
  // Find the matching close paren for the parameter list, quote-aware.
  let paren = 0;
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let close = -1;
  for (let i = 0; i < rest.length; i++) {
    const c = rest[i];
    const prev = i > 0 ? rest[i - 1] : '';
    if (c === "'" && !inDouble && !inBacktick && prev !== '\\') inSingle = !inSingle;
    else if (c === '"' && !inSingle && !inBacktick && prev !== '\\') inDouble = !inDouble;
    else if (c === '`' && !inSingle && !inDouble && prev !== '\\') inBacktick = !inBacktick;
    else if (!inSingle && !inDouble && !inBacktick) {
      if (c === '(') paren++;
      else if (c === ')') {
        paren--;
        if (paren === 0) {
          close = i;
          break;
        }
      }
    }
  }
  if (close === -1) {
    return;
  }
  const paramsRaw = rest.slice(1, close);
  const afterParams = rest.slice(close + 1).trim();
  if (!afterParams.startsWith('=>')) {
    return;
  }
  const retRaw = afterParams.slice(2).trim();
  if (!retRaw) {
    return;
  }
  return {paramsRaw, retRaw, isNew};
}
/**
 * Parses an object-literal entry as an index signature (`[n: number]: T`).
 * Returns undefined for ordinary `name: type` entries, null for malformed
 * bracket entries.
 * @param {string} entry - The raw entry text.
 * @returns {ExpandIndexSignatureNode | undefined | null} The signature, undefined for ordinary entries, null when malformed.
 */
function parseIndexSignatureEntry(entry) {
  const trimmed = entry.trim();
  if (trimmed === '') {
    return undefined;
  }
  if (!trimmed.startsWith('[')) {
    return undefined;
  }
  // Find the matching `]` for the opening `[`, quote-aware.
  let square = 0;
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let closeIdx = -1;
  for (let i = 0; i < trimmed.length; i++) {
    const c = trimmed[i];
    const prev = i > 0 ? trimmed[i - 1] : '';
    if (c === "'" && !inDouble && !inBacktick && prev !== '\\') inSingle = !inSingle;
    else if (c === '"' && !inSingle && !inBacktick && prev !== '\\') inDouble = !inDouble;
    else if (c === '`' && !inSingle && !inDouble && prev !== '\\') inBacktick = !inBacktick;
    else if (!inSingle && !inDouble && !inBacktick) {
      if (c === '[') square++;
      else if (c === ']') {
        square--;
        if (square === 0) {
          closeIdx = i;
          break;
        }
      }
    }
  }
  if (closeIdx === -1) {
    return null;
  }
  const paramRaw = trimmed.slice(1, closeIdx).trim();
  const afterBracket = trimmed.slice(closeIdx + 1).trim();
  if (!afterBracket.startsWith(':')) {
    return null;
  }
  const valueRaw = afterBracket.slice(1).trim();
  const paramColon = findTopLevelChar(paramRaw, ':');
  if (paramColon === -1 || !valueRaw) {
    return null;
  }
  const paramName = paramRaw.slice(0, paramColon).trim();
  const paramTypeRaw = paramRaw.slice(paramColon + 1).trim();
  if (!paramName || !paramTypeRaw) {
    return null;
  }
  return {
    type: 'indexSignature',
    indexType: expandTypeDepFree(valueRaw),
    indexParameters: [{type: expandTypeDepFree(paramTypeRaw), name: paramName}],
  };
}
/**
 * Splits a backtick template literal into quasis and `${...}` type raws.
 * Returns undefined when the literal is malformed (unbalanced backticks
 * or braces).
 * @param {string} type - The raw literal including backticks.
 * @returns {{quasis: string[], typeRaws: string[]} | undefined} Parts.
 */
function parseTemplateLiteralRaw(type) {
  const inner = type.slice(1, -1);
  const quasis = [];
  const typeRaws = [];
  let current = '';
  let i = 0;
  while (i < inner.length) {
    const dollar = inner.indexOf('${', i);
    if (dollar === -1) {
      current += inner.slice(i);
      break;
    }
    current += inner.slice(i, dollar);
    // Find the matching `}` for this interpolation, nesting-aware.
    let depth = 0;
    let j = dollar + 2;
    let closed = false;
    while (j < inner.length) {
      const c = inner[j];
      if (c === '{') depth++;
      else if (c === '}') {
        if (depth === 0) {
          closed = true;
          break;
        }
        depth--;
      }
      j++;
    }
    if (!closed) {
      return;
    }
    quasis.push(current);
    current = '';
    typeRaws.push(inner.slice(dollar + 2, j).trim());
    i = j + 1;
  }
  quasis.push(current);
  return {quasis, typeRaws};
}
/**
 * Expands one tuple element: `...T` becomes a rest node, `...b: T[]`
 * becomes a named `tupleMember` with `dotDot`, `label: T` and
 * `label?: T` become `tupleMember` nodes, a bare trailing `?` without a
 * label yields undefined (matching the TS and Babel parsers, which leave
 * unnamed optional elements unhandled), and anything else expands plainly.
 * @param {string} raw - The trimmed element text.
 * @returns {ExpandedType | undefined} The element node.
 */
function expandTupleElement(raw) {
  if (raw.startsWith('...')) {
    const rest = raw.slice(3).trim();
    if (!rest) {
      return;
    }
    const colonIdx = findTopLevelChar(rest, ':');
    if (colonIdx !== -1) {
      const name = rest.slice(0, colonIdx).trim();
      const typeRaw = rest.slice(colonIdx + 1).trim();
      if (!name || !typeRaw) {
        return;
      }
      return {
        type: 'tupleMember',
        name,
        elementType: expandTypeDepFree(typeRaw),
        dotDot: true,
      };
    }
    return {type: 'rest', annotation: expandTypeDepFree(rest)};
  }
  const colonIdx = findTopLevelChar(raw, ':');
  if (colonIdx === -1) {
    // Unnamed trailing `?` (`[string, number?]`): the TS and Babel parsers
    // leave OptionalType unhandled, so match their undefined.
    if (raw.endsWith('?') && raw.length > 1) {
      return;
    }
    return expandTypeDepFree(raw);
  }
  let name = raw.slice(0, colonIdx).trim();
  const typeRaw = raw.slice(colonIdx + 1).trim();
  if (!name || !typeRaw) {
    return;
  }
  let optional = false;
  if (name.endsWith('?') && name.length > 1) {
    optional = true;
    name = name.slice(0, -1).trim();
  }
  if (!name) {
    return;
  }
  /** @type {ExpandTupleMemberNode} */
  const member = {type: 'tupleMember', name, elementType: expandTypeDepFree(typeRaw)};
  if (optional) {
    member.optional = true;
  }
  return member;
}
/**
 * 'DepFree' refers to the fact that this function has no dependencies,
 * while `expandType` depends on TypeScript itself for maximum compatibility.
 * @example
 * expandTypeDepFree('(123)                   '); // Outputs: '123'
 * expandTypeDepFree('Array<number>           '); // Outputs: { type: 'array', elementType: 'number' }
 * expandTypeDepFree('Array<(123) >           '); // Outputs: { type: 'array', elementType: '123' }
 * expandTypeDepFree('  ( ( 123 ) )           '); // Outputs: '123'
 * expandTypeDepFree('  (string ) |(number )  '); // Outputs: { type: 'union', members: ['string', 'number'] }
 * expandTypeDepFree(' ((  Object  ) )        '); // Outputs: { type: 'object', properties: {} }
 * @param {string} type - The input type to expand.
 * @returns {ExpandedType} Object containing parsed information from type string.
 */
function expandTypeDepFree(type) {
  type = type.trim();
  // '(123)' -> '123': strip balanced outer parens first so `(cond)?`
  // nullable and `(A|B)` unions see through them.
  const stripped = stripOuterParens(type);
  if (stripped !== type) {
    return expandTypeDepFree(stripped);
  }
  // `readonly T` erased at runtime, same shape as the inner type.
  if (type.startsWith('readonly ') && type.length > 9) {
    return expandTypeDepFree(type.slice(9).trim());
  }
  if (type === 'unique symbol') {
    return 'symbol';
  }
  // Conditionals before nullable: `A extends B ? C : D?` must keep the
  // nullable on the false branch, not lift it over the whole condition.
  // (`(cond)?` has no top-level `?` due to parens, so it falls through
  // to nullable below.)
  const earlyCond = parseConditionRaw(type);
  if (earlyCond) {
    return {
      type: 'condition',
      checkType: expandTypeDepFree(earlyCond.check),
      extendsType: expandTypeDepFree(earlyCond.extends_),
      trueType: expandTypeDepFree(earlyCond.true_),
      falseType: expandTypeDepFree(earlyCond.false_),
    };
  }
  // JSDocNullableType (`T?` / `?T`): union with null, matching expandType().
  if (type.endsWith('?') && type.length > 1) {
    return {type: 'union', members: [expandTypeDepFree(type.slice(0, -1).trim()), 'null']};
  }
  if (type.startsWith('?') && type.length > 1) {
    return {type: 'union', members: [expandTypeDepFree(type.slice(1).trim()), 'null']};
  }
  // (0) Function and constructor types `(a: T, ...) => R`, `new (a: T) => R`.
  const func = parseFunctionRaw(type);
  if (func) {
    const parameters = parseFunctionParams(func.paramsRaw);
    if (parameters !== undefined) {
      const ret = expandTypeDepFree(func.retRaw);
      if (func.isNew) {
        return {type: 'new', parameters, ret};
      }
      return {type: 'function', parameters};
    }
  }
  // (1) Rest parameters like ...string
  if (type[0] === '.' && type[1] === '.' && type[2] === '.') {
    const elementType = expandTypeDepFree(type.slice(3).trim());
    return {type: 'array', elementType};
  }
  // (2)
  // Array<...>
  if (type.startsWith("Array<") && type.endsWith('>')) {
    const typeSlice = type.slice(6, -1);
    const elementType = expandTypeDepFree(typeSlice);
    return {type: "array", elementType};
  }
  // Promise<...>
  if (type.startsWith("Promise<") && type.endsWith('>')) {
    const typeSlice = type.slice(8, -1);
    const elementType = expandTypeDepFree(typeSlice);
    return {type: "promise", elementType};
  }
  // (3) Object<...> or Record<...>
  if (
    (
      type.startsWith("Object<") ||
      type.startsWith("Record<")
    ) && type.endsWith('>')) {
    const recordSlice = type.slice(7, -1);
    const commaIdx = findTopLevelChar(recordSlice, ',');
    if (commaIdx === -1) {
      console.warn("expandTypeDepFree> invalid Object/Record");
    } else {
      const key = recordSlice.slice(0, commaIdx).trim();
      const val = recordSlice.slice(commaIdx + 1).trim();
      return {
        type: "record",
        key: expandTypeDepFree(key),
        val: expandTypeDepFree(val),
      };
    }
  }
  // (3b) Map<...> / Set<...' for dep-free parity with expandType()
  if (type.startsWith("Map<") && type.endsWith('>')) {
    const inner = type.slice(4, -1);
    const parts = splitTopLevel(inner, ',');
    if (parts.length === 2) {
      return {
        type: "map",
        key: expandTypeDepFree(parts[0].trim()),
        val: expandTypeDepFree(parts[1].trim()),
      };
    }
  }
  if (type.startsWith("Set<") && type.endsWith('>')) {
    const inner = type.slice(4, -1);
    return {
      type: "set",
      elementType: expandTypeDepFree(inner.trim()),
    };
  }
  // (3c) Generic reference types like ArrayLike<T>, ReadonlyArray<T> etc.
  // Keep structured so the runtime can validate them instead of warning 'unchecked'.
  const genericRef = parseGenericReference(type);
  if (genericRef) {
    const {name, args} = genericRef;
    return {type: 'reference', name, args: args.map(expandTypeDepFree)};
  }
  // (4) Mapped types `{[K in X as Y]?: Z}` before the object-literal fallback.
  if (type[0] === '{' && type[type.length - 1] === '}') {
    const mapped = parseMappedRaw(type);
    if (mapped) {
      /** @type {ExpandMappingNode} */
      const out = {
        type: 'mapping',
        iterable: expandTypeDepFree(mapped.iterableRaw),
        element: mapped.element,
        result: expandTypeDepFree(mapped.resultRaw),
      };
      if (mapped.nameRaw !== undefined) {
        out.nameType = expandTypeDepFree(mapped.nameRaw);
      }
      if (mapped.question !== undefined) {
        out.question = mapped.question;
      }
      if (mapped.readonly !== undefined) {
        out.readonly = mapped.readonly;
      }
      return out;
    }
    const propertiesArray = splitTopLevel(type.slice(1, -1), ','); // ['entity: Entity', ' app: AppBase']
    /** @type {Object<string, ExpandedType>} */
    const properties = {};
    /** @type {ExpandIndexSignatureNode[] | undefined} */
    let indexSignatures;
    for (const entry of propertiesArray) {
      // Index signature entries `[n: number]: T` before the `name: type` split.
      const signature = parseIndexSignatureEntry(entry);
      if (signature === null) {
        console.warn('expandTypeDepFree> unexpected type format, fix');
        continue;
      }
      if (signature !== undefined) {
        indexSignatures = indexSignatures ?? [];
        indexSignatures.push(signature);
        continue;
      }
      const colonIdx = findTopLevelChar(entry, ':');
      if (colonIdx === -1) {
        // Empty `{}` yields one empty entry: the empty object type.
        if (entry.trim() === '') {
          continue;
        }
        console.warn('expandTypeDepFree> unexpected type format, fix');
        continue;
      }
      let propName = entry.slice(0, colonIdx).trim();
      const propTypeRaw = entry.slice(colonIdx + 1).trim();
      if (!propName || !propTypeRaw) {
        console.warn('expandTypeDepFree> unexpected type format, fix');
        continue;
      }
      // `readonly a: T` prefix and `a?: T` suffix, matching expandType().
      let propReadonly = false;
      if (propName.startsWith('readonly ') && propName.length > 9) {
        propReadonly = true;
        propName = propName.slice(9).trim();
      }
      let propOptional = false;
      if (propName.endsWith('?') && propName.length > 1) {
        propOptional = true;
        propName = propName.slice(0, -1).trim();
      }
      if (!propName) {
        console.warn('expandTypeDepFree> unexpected type format, fix');
        continue;
      }
      let expanded = expandTypeDepFree(propTypeRaw);
      if (propOptional || propReadonly) {
        if (expanded !== null && typeof expanded === 'object') {
          if (propOptional) /** @type {{optional?: boolean}} */ (expanded).optional = true;
          if (propReadonly) /** @type {{readonly?: boolean}} */ (expanded).readonly = true;
        } else {
          /** @type {ExpandAnnotatedAtomNode} */
          const wrapped = {type: expanded};
          if (propOptional) wrapped.optional = true;
          if (propReadonly) wrapped.readonly = true;
          expanded = wrapped;
        }
      }
      properties[propName] = expanded;
    }
    // Bare `{}` carries no `properties` key, matching the TS/Babel parsers
    // (and distinguishing it from the `object` keyword, which does).
    if (!Object.keys(properties).length && indexSignatures === undefined) {
      return {type: 'object'};
    }
    /** @type {ExpandObjectNode} */
    const out = {type: 'object'};
    if (Object.keys(properties).length) {
      out.properties = properties;
    }
    if (indexSignatures !== undefined) {
      out.indexSignatures = indexSignatures;
    }
    return out;
  }
  // (5) Unions and intersections via top-level splits (`&` binds tighter, so `|` first).
  // Note: conditionals already handled up front (before nullable) so `D?`
  // false branches keep their nullability; this slot is intentionally union-only.
  const unionParts = splitTopLevel(type, "|");
  if (unionParts.length >= 2) {
    return {
      type: 'union',
      members: unionParts.map((_) => expandTypeDepFree(_.trim())),
    };
  }
  const interParts = splitTopLevel(type, "&");
  if (interParts.length >= 2) {
    return {
      type: 'intersection',
      members: interParts.map((_) => expandTypeDepFree(_.trim())),
    };
  }
  // (7) `keyof T` before typeof so `keyof typeof X` nests correctly.
  if (type.startsWith('keyof ') || type.startsWith('keyof(')) {
    const after = type.startsWith('keyof(') ? type.slice(5).trim() : type.slice(6).trim();
    if (after) {
      return {type: 'keyof', argument: expandTypeDepFree(after)};
    }
  }
  // (8) Indexed access `T[K]` (arrays `T[]` handled below, tuples above start with `[`).
  const indexed = parseIndexedAccessRaw(type);
  if (indexed) {
    return {
      type: 'indexedAccess',
      index: expandTypeDepFree(indexed.indexRaw),
      object: expandTypeDepFree(indexed.objectRaw),
    };
  }
  // (9) expand [] Arrays
  // Test arrays: new pc.Mat3().set([1, 2, 3, "asd"])
  if (type.endsWith("[]")) {
    const typeSlice = type.slice(0, -2);
    return {
      type: 'array',
      elementType: expandTypeDepFree(typeSlice)
    };
  }
  // (10) expand tuples
  if (type[0] === '[' && type[type.length - 1] === ']') {
    const inner = type.slice(1, -1);
    if (inner.trim() === '') {
      return {type: 'tuple', elements: []};
    }
    const elements = splitTopLevel(inner, ','); // ['null', ' Texture', ...]
    /** @type {(ExpandedType | undefined)[]} */
    const expanded = elements.map((_) => expandTupleElement(_.trim()));
    // Unnamed optional elements (`[string, number?]`) expand to undefined,
    // matching the TS and Babel parsers, which leave OptionalType unhandled.
    return {
      type: 'tuple',
      elements: /** @type {ExpandedType[]} */ (expanded),
    };
  }
  // Template literals `` `id` `` / `` `${A}_id` ``, matching expandType().
  // Must come before the bare backtick-quoted literal fallthrough below.
  if (type.startsWith('`') && type.endsWith('`') && type.length >= 2) {
    const template = parseTemplateLiteralRaw(type);
    if (template) {
      return {
        type: 'templateLiteral',
        quasis: template.quasis,
        types: template.typeRaws.map((_) => expandTypeDepFree(_)),
      };
    }
  }
  // (11) expand typeof expressions
  if (type.startsWith('typeof ')) {
    const argument = expandTypeDepFree(type.substring(7).trim());
    return {type: 'typeof', argument};
  }
  if (type === 'object' || type === 'Object') {
    return {
      type: 'object',
      properties: {},
    };
  }
  // Literal normalization for parity with expandType():
  // numeric literals become numbers, true/false become booleans.
  if (type === 'true') {
    return true;
  }
  if (type === 'false') {
    return false;
  }
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(type)) {
    return Number(type);
  }
  // Bigint: `bigint` keyword and `123n` literals, matching expandType().
  if (type === 'bigint') {
    return {type: 'bigint'};
  }
  if (/^\d+n$/.test(type)) {
    return {type: 'bigint', literal: type.slice(0, -1)};
  }
  return type;
}
export {expandTypeDepFree};
