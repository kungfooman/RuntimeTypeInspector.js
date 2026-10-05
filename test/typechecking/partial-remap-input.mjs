/**
 * Key remapping under utilities: `as` filters written as conditions (either polarity) or idiomatic `Exclude` drop exactly the filtered keys, and `Partial` then applies to the remapped shape. Every throwing call carries `@ts-expect-error`, so a tsc-strict run is green if and only if each directive is consumed and nothing else errors; `*-errors.json` pins the same sequence for RTI.
 */
/**
 * @typedef {object} Row
 * @property {number} keep
 * @property {string} drop
 * @property {boolean} flag
 */
/**
 * @typedef {{ [K in keyof Row as Exclude<K, 'drop'>]: Row[K] }} KeptExclude
 */
/**
 * @param {Partial<KeptExclude>} x
 */
function takeExclude(x) {
  return x;
}
takeExclude({}); // ok
takeExclude({ keep: 1, flag: true }); // ok
// @ts-expect-error: string is not assignable to number
takeExclude({ keep: 'x' });
// @ts-expect-error: drop does not exist on the remapped shape
takeExclude({ drop: 's' });
/**
 * @typedef {{ [K in keyof Row as K extends 'drop' ? never : K]: Row[K] }} KeptFalse
 */
/**
 * @param {Partial<KeptFalse>} x
 */
function takeFalsePolarity(x) {
  return x;
}
takeFalsePolarity({}); // ok: true-never polarity drops the same way
takeFalsePolarity({ keep: 1 }); // ok
// @ts-expect-error: drop does not exist on the remapped shape
takeFalsePolarity({ drop: 's' });
/**
 * @typedef {{ [K in keyof Row as K extends 'keep' | 'flag' ? K : never]: Row[K] }} KeptTrue
 */
/**
 * @param {KeptTrue} x
 */
function takeBaseRemap(x) {
  return x;
}
takeBaseRemap({ keep: 1, flag: true }); // ok: remapping works unmapped too
// @ts-expect-error: drop does not exist on the remapped shape
takeBaseRemap({ keep: 1, drop: 's' });
