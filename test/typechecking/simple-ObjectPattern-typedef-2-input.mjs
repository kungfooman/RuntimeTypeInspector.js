/**
 * @param {PretrainedOptions} [something] Optional parameters.
 */
function test(
  {
    revision = 'main',
  } = {}
) {
  return revision;
}
const ret = test();
console.log('ret', ret);
