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
export {extractCurlyContent};
