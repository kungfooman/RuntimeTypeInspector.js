"insert types and eval";
/**
 * @param {Entity} a
 * @param {Object<string, [number, number]>} b
 * @param {string & number & Date | {a: number, b: string} & Entity[]} c
 * @param {Entity | null | undefined} d
 * @param {Array<number[]>} e
 * @param {string | Class<ScriptType>>} f
 * @param {globalThis.KeyboardEvent} g
 */
function test(a, b, c, d, e, f, g) {
  console.log('a', a);
  console.log('b', b);
  console.log('c', c);
  console.log('d', d);
  console.log('e', e);
  console.log('f', f);
  console.log('g', g);
}
console.clear();
typecheckReset();
test(
  0,
  1,
  2,
  3,
  4,
  5,
  6
);
