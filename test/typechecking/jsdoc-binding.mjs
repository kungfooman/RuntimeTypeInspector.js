/**
 * @param {number} a
 */
const add1 = a => {
  return b => a + b;
}
/**
 * @param {number} a
 */
const add2 = a => {
  /* random comment */
  return b => a + b;
}
/**
 * @example add3(10)(20)
 * @param {number} a
 */
const add3 = a => {
  return b => a + b;
}
/**
 * @param {number} a
 */
const add4 = a => {
  /**
   * @param {number} b
   */
  return b => a + b;
}
/**
 * @param {number} a
 * @param {number} b
 */
(a, b) => a + b;
/**
 * @param {number} a
 */
export default a => b => a + b;
/**
 * @param {number} a
 * @param {number} b
 */
export const add5 = (a, b) => a + b;
console.log('add1(10)(20)', add1(10)(20));
console.log('add2(10)(20)', add2(10)(20));
console.log('add3(10)(20)', add3(10)(20));
console.log('add4(10)(20)', add4(10)(20));
//console.log('add5(10)(20)', add5(10)(20));
