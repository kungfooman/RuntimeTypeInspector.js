/**
 * @param {1|2|3} a - Input number: 1 to 3.
 * @returns {number} Squared input.
 */
function square123(a) {
  if (!inspectType(a, {
    "type": "union",
    "members": [
      1,
      2,
      3
    ],
    "optional": false
  }, 'square123', 'a')) {
    youCanAddABreakpointHere();
  }
  return a * a;
}
// good
square123(1);
square123(2);
square123(3);
// bad
square123(0);
square123(4);
square123("2");
square123("4");
