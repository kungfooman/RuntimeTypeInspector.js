/** @typedef {any[]|{length: number}} SomethineWithLength */
/**
 * @template {SomethineWithLength} T
 * @typedef {T['length'] extends number ? T : never} HasLength
 */
/**
 * @template {SomethineWithLength} A
 * @template {SomethineWithLength} B
 * @param {HasLength<A>} a - First argument.
 * @param {HasLength<B>} b - Second argument.
 */
function test(a, b) {
  console.log('a', a);
  console.log('b', b);
}
const a = ['a', 'b', 'c'];
const b = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
test({}, b);
test([], 123);
