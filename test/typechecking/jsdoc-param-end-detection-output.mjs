/**
 * @param {number[]} [nodes] - Defaults to [].
 */
function test(nodes = []) {
  if (!inspectType(nodes, {
    "type": "array",
    "elementType": "number",
    "optional": true
  }, 'test', 'nodes')) {
    youCanAddABreakpointHere();
  }
  return nodes;
}
const ret = test([1, 2, 3]);
console.log('ret', ret);
