/**
 * @typedef {object} TypeError
 * @property {number} hits - How often this error occured.
 * @property {HTMLTableRowElement} tr - The <tr>.
 * @property {boolean} dbg - Trigger `debugger;` next time this error is hit.
 */
const options = {
  /**
   * @type {'spam'|'once'|'never'} - In spam-mode every message is printed. In once-mode a cache is
   * looked up to check if it was printed already. Spam can be too noisy if there are too
   * many type errors, so the best way to keep it quiet is to fix the noisiest type issues first.
   * Spam-mode basically retains the order, which mentally helps to figure out the actual issues.
   */
  mode: 'spam',
  /** @type {Record<string, TypeError>} */
  warned: {},
  logSuperfluousProperty: false,
  count: 0,
};
function report() {
  console.table(options.warned);
}
/**
 * @param {Object<string, any>} obj - The object to clear.
 */
function clearObject(obj) {
  Object.keys(obj).forEach(_ => delete obj[_]);
}
function reset() {
  clearObject(options.warned);
}
export {report, clearObject, reset, options};
