/**
 * @todo Move everything into TypePanel, since every panel/worker should have its own controls.
 */
const options = {
  enabled: true,
  /**
   * @type {'spam'|'once'|'never'} - In spam-mode every message is printed. In once-mode a cache is
   * looked up to check if it was printed already. Spam can be too noisy if there are too
   * many type errors, so the best way to keep it quiet is to fix the noisiest type issues first.
   * Spam-mode basically retains the order, which mentally helps to figure out the actual issues.
   */
  mode: 'spam',
  logSuperfluousProperty: false,
  count: 0,
  /**
   * Matches TypeScript `strictNullChecks`: when `true` (default), `null` and
   * `undefined` only pass optional/nullable types. When `false`, they pass
   * every type, so dammed-up `SomeType`-but-actually-nullable noise stops
   * hiding the real errors. Toggleable via the TypePanel checkbox.
   */
  strictNullChecks: true,
  /**
   * When `true` (default), `+-Infinity` fails `number` validation, catching
   * `NaN` precursors like `Infinity - Infinity`. When `false`, infinities
   * pass `number`. `NaN` always fails. Toggleable via the TypePanel checkbox.
   */
  checkInfinity: true,
};
export {options};
