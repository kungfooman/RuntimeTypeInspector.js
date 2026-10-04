/**
 * Homomorphic mapped types keep source optionality: `{[P in keyof Merged]: Merged[P]}` over a `Partial` base with `Omit` plus union overrides used to materialize every property required, so the panel reported dozens of false `missing` findings for valid partial data that tsc accepts. Every throwing call carries `@ts-expect-error`, so a tsc-strict run is green if and only if each directive is consumed and nothing else errors; `*-errors.json` pins the same sequence for RTI.
 */
class Vec3 {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
  }
}
/**
 * @typedef {object} Shape
 * @property {number} count - A count.
 * @property {Vec3} pos - A position.
 */
/**
 * @typedef {object} Overrides
 * @property {Vec3 | Array<number>} [pos] - A position, also accepting an array.
 */
/**
 * @typedef {Omit<Partial<Shape>, keyof Overrides> & Overrides} Merged
 */
/**
 * @typedef {{ [P in keyof Merged]: Merged[P] }} Options
 */
/**
 * @param {Options} data - The options.
 */
function takeOptions(data) {
  return data;
}
takeOptions({}); // ok: everything optional through Partial
takeOptions({count: 1}); // ok
takeOptions({pos: [1, 2, 3]}); // ok: override union accepts arrays
takeOptions({pos: new Vec3(), count: 2}); // ok
// @ts-expect-error: string is neither Vec3 nor number[]
takeOptions({pos: 'x'});
/**
 * @param {Merged} data - Direct merged check, no mapping.
 */
function takeMerged(data) {
  return data;
}
takeMerged({}); // ok
// @ts-expect-error: string is neither Vec3 nor number[]
takeMerged({pos: 'x'});
/**
 * @typedef {Omit<Shape, keyof Overrides> & Overrides} StrictMerged
 */
/**
 * @typedef {{ [P in keyof StrictMerged]: StrictMerged[P] }} StrictOptions
 */
/**
 * @param {StrictOptions} data - Same chain without Partial: base stays required.
 */
function takeStrict(data) {
  return data;
}
takeStrict({count: 1}); // ok: pos stays optional through the override
// @ts-expect-error: missing required count
takeStrict({});
// @ts-expect-error: string is neither Vec3 nor number[]
takeStrict({count: 1, pos: 'x'});
/**
 * @param {Merged["pos"]} pos - Direct indexed access keeps the override union.
 */
function takePos(pos) {
  return pos;
}
takePos([1, 2, 3]); // ok
takePos(new Vec3()); // ok
// @ts-expect-error: string is neither Vec3 nor number[]
takePos('x');
