/**
 * @param {{[n: number]: string, length: number}} words
 */
function countWords(words) {
  if (!inspectType(words, {
    "type": "object",
    "properties": {
      "length": "number"
    },
    "indexSignatures": [
      {
        "type": "indexSignature",
        "indexType": "string",
        "indexParameters": [
          {
            "type": "number",
            "name": "n"
          }
        ]
      }
    ],
    "optional": false
  }, 'countWords', 'words')) {
    youCanAddABreakpointHere();
  }
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
