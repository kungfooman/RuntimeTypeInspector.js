"insert types and eval";
/**
 * @param {object} [arg]
 * @param {boolean} arg.transparent
 * @param {{r: number, g: number, b: number}} [arg.color]
 */
function test(arg) {
  console.log('arg', arg)
}
console.clear();
typecheckReset();
statsPrint();
test({
  transparent: true
});
test({
  transparent: false,
  color: {r:1, g:2} // Error: missing b
});
