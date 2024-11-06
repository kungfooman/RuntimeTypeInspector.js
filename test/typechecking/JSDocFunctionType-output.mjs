/**
 * @param {function (number, number): number} cb
 */
function op(cb, a, b) {
  if (!inspectType(cb, {
    "type": "function",
    "parameters": [
      {
        "type": "number",
        "name": "undefined"
      },
      {
        "type": "number",
        "name": "undefined"
      }
    ],
    "optional": false
  }, 'op', 'cb')) {
    youCanAddABreakpointHere();
  }
  return cb(a, b);
}
const ret = op((a, b) => {
  return a + b;
}, 10, 20);
console.log("ret", ret);
