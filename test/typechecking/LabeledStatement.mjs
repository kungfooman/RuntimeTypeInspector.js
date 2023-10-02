/**
 * @param {string} str
 */
function parse(str) {
  loop:
  for (const c of str) {
    if (c === 'z') {
      break loop;
    }
    if (c === 'c') {
      continue loop;
    }
    if (c === 'a') {
      continue;
    }
    if (c === 'b') {
      break;
    }
  }
}
parse('abc z def');
