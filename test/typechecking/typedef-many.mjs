/**
 * @typedef {{ a: number, b: number }} AB
 * @typedef {{ c: number, d: number }} CD
 * @typedef {{ e: number, f: number }} EF
 * @typedef {object} GH
 * @property {number} g
 * @property {number} h
 * @typedef {{i: number}} IJ
 * @property {number} j
 * @typedef {{ k: number, l: number }} KL
 */
/**
 * @param {AB} _
 */
function addAB(_) {
  return _.a + _.b;
}
const retAB = addAB({a: 10, b: 20});
/**
 * @param {CD} _
 */
function addCD(_) {
  return _.c + _.d;
}
const retCD = addCD({c: 10, d: 20});
/**
 * @param {EF} _
 */
function addEF(_) {
  return _.e + _.f;
}
const retEF = addEF({e: 10, f: 20});
/**
 * @param {GH} _
 */
function addGH(_) {
  return _.g + _.h;
}
const retGH = addGH({g: 10, h: 20});
/**
 * @param {IJ} _
 */
function addIJ(_) {
  return _.i + _.j;
}
const retIJ = addIJ({i: 10, j: 20});
/**
 * @param {KL} _
 */
function addKL(_) {
  return _.k + _.l;
}
/**
 * @type {number[]}
 */
const arrayKL = [10_20];
const [k, l] = arrayKL;
const retKL = addKL({k, l});
console.table({retAB, retCD, retEF, retGH, retIJ, retKL});
