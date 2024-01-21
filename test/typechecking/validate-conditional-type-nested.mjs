/**
 * This creates a nested array of a given type and depth (see examples).
 *
 * @example
 *   NestArray<string, 1>; // string[]
 * @example
 *   NestArray<number, 2>; // number[][]
 * @example
 *   NestArray<string, 3>; // string[][][] etc.
 * @template T
 * @template {number} Depth
 * @template {never[]} [Acc=[]]
 * @typedef {Acc['length'] extends Depth ? T : NestArray<T[], Depth, [...Acc, never]>} NestArray
 */
/**
 * @param {NestArray<string, 1>} a - First argument.
 * @param {NestArray<number, 2>} b - Second argument.
 */
function test(a, b) {
  console.log('a', a);
  console.log('b', b);
}
const a = ['a', 'b', 'c'];
const b = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
test(a, b);
