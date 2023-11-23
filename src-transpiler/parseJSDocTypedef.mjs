import {extractNameAndOptionality} from './extractNameAndOptionality.mjs';
import {simplifyType             } from './simplifyType.mjs';
/**
 * Extracts the content of a string that is delimited by curly braces.
 * @example
 * extractCurlyContent('{ {inner} }'); // Returns: {content: ' {inner} ', nextIndex: 11}
 * @param {string} line - The string to extract from.
 * @returns {{content: string, nextIndex: number}} An object containing the extracted content,
 * and the index of the character immediately following the closing curly brace.
 */
function extractCurlyContent(line) {
  const firstCurly = line.indexOf('{');
  let k = firstCurly + 1;
  let count = 0;
  for (; k < line.length; k++) {
    const c = line[k];
    if (c === '{') {
      count++;
    } else if (c === '}') {
      count--;
    }
    if (count === -1) {
      break;
    }
  }
  const content = line.substring(firstCurly + 1, k);
  return {content, nextIndex: k + 1};
}
/**
 * Parses JSDoc comments to extract and expand typedefs and their associated properties.
 *
 * It iterates through the lines of a `CommentBlock` from the Babel AST, looking for `@typedef` and `@property`
 * annotations. When it finds a typedef, it stores it in the `typedefs` record. When it finds a property,
 * it adds it to the last found typedef if it is an object type.
 * @param {Record<string, object>} typedefs - An object to store typedefs, mapping type names to their expanded definitions.
 * @param {Console["warn"]} warn - A warn function used for emitting warnings about non-extensible types.
 * @param {import("@babel/types").Comment} comment - A comment extracted from Babel's AST, expected to be a CommentBlock containing type definitions.
 * @param {Function} expandType - A function that takes a type expression as a string and returns a structured representation of the type.
 */
function parseJSDocTypedef(typedefs, warn, comment, expandType) {
  const {type, value} = comment;
  if (type !== 'CommentBlock') {
    return;
  }
  const lines = value.split('\n');
  let lastTypedef;
  for (let line of lines) {
    line = line.trim();
    if (line[0] === '*') {
      line = line.slice(1).trim();
    }
    if (line.startsWith('@typedef')) {
      const {content: def, nextIndex} = extractCurlyContent(line);
      let name = line.substring(nextIndex).trim();
      // Drop description
      name = name.split(' ')[0];
      lastTypedef = expandType(def);
      // Ignore @typedef's that only refer to themselves in another file (see typedef-overwrite test)
      if (lastTypedef !== name) {
        typedefs[name] = lastTypedef;
      }
    } else if (line.startsWith('@property')) {
      // class @property
      if (!lastTypedef) {
        continue;
      }
      const {content, nextIndex} = extractCurlyContent(line);
      const rest = line.substring(nextIndex);
      const propType = expandType(content);
      const [name, optional] = extractNameAndOptionality(rest);
      // console.log({name, optional, propType});
      const finalType = simplifyType(propType, optional);
      if (lastTypedef?.type === 'object') {
        lastTypedef.properties[name] = finalType;
      } else {
        warn("not an extensible type", lastTypedef);
      }
    }
  }
}
export {extractCurlyContent, parseJSDocTypedef};
