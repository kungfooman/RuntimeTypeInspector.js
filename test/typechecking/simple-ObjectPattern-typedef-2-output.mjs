/**
 * @param {PretrainedOptions} [something] Optional parameters.
 */
function test({
  revision = 'main',
} = {}) {
  if (!inspectType(arguments[0], {
    "type": "PretrainedOptions",
    "optional": true
  }, 'test', 'something')) {
    youCanAddABreakpointHere();
  }
  return revision;
}
const ret = test();
console.log('ret', ret);
