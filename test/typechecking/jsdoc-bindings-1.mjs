/**
 * @param {number} a
 */
const add = a => {
  /**
   * @param {number} b
   */
  return b => a + b;
}
console.log('add(10)(20)', add(10)(20));

