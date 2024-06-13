/**
 * @param {{[n: number]: string, length: number}} words
 */
function countWords(words) {
  return words.length;
}
countWords({
  0: 'Hello',
  1: ' ',
  2: 'World',
  3: '!',
  length: 4
});
countWords(['Hello', ' ', 'World', '!']);
