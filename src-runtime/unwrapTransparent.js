/**
 * Unwraps runtime-transparent utility wrappers to the nominal name they
 * carry: `Readonly<T>`, `NonNullable<T>` and `NoInfer<T>` do not change the
 * runtime shape (`validateReference` recurses straight into the argument),
 * so a tagged snapshot nominates the inner name, not the wrapper. Harvested
 * class properties spell getter types (`Readonly<Color>` wins over the
 * setter's `Color`), which is why union members arrive wrapped while the
 * tag stays bare. Anything else (including `Partial`, which changes
 * optionality) is not transparent and returns undefined.
 * @param {*} expect - An expected type node.
 * @returns {string|undefined} The inner nominal name, or undefined.
 * @example
 * unwrapTransparent({type: 'reference', name: 'Readonly', args: ['Color']}); // 'Color'
 * unwrapTransparent({type: 'reference', name: 'Partial', args: ['Color']}); // undefined
 * unwrapTransparent('Color'); // 'Color'
 */
function unwrapTransparent(expect) {
  if (typeof expect === 'string') {
    return expect;
  }
  if (expect && typeof expect === 'object' && expect.type === 'reference' &&
    (expect.name === 'Readonly' || expect.name === 'NonNullable' || expect.name === 'NoInfer') &&
    Array.isArray(expect.args) && expect.args.length === 1) {
    return unwrapTransparent(expect.args[0]);
  }
  return undefined;
}
export {unwrapTransparent};
