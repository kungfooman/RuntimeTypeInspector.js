/**
 * Hostile `@overload` dotted containers: the playcanvas `script/component.js`
 * `args` shape. Every throwing call carries `@ts-expect-error`, so a
 * tsc-strict run is green if and only if each directive is consumed and
 * nothing else errors; `*-errors.json` pins the same sequence for RTI.
 * The dotted children validate as object properties: wrong types warn,
 * unknown options warn, both checkers agree call by call.
 */
class Scripts {
  /**
   * @overload
   * @param {string} name - The name of the script.
   * @param {object} [args] - Object with arguments for a script.
   * @param {boolean} [args.enabled] - If script instance is enabled after creation.
   * @param {object} [args.attributes] - Object with values for attributes.
   * @returns {string|null} The instance or null.
   */
  /**
   * @param {string} name - The name of the script.
   * @param {object} [args] - Object with arguments for a script.
   * @param {boolean} [args.enabled] - If script instance is enabled after creation.
   * @param {object} [args.attributes] - Object with values for attributes.
   * @returns {string|null} The instance or null.
   */
  create(name, args) {
    return name;
  }
}
const scripts = new Scripts();
scripts.create('player'); // ok: args optional
scripts.create('player', {enabled: true}); // ok
scripts.create('player', {enabled: true, attributes: {speed: 1}}); // ok
// @ts-expect-error: enabled must be boolean
scripts.create('player', {enabled: 1});
// @ts-expect-error: name must be a string
scripts.create(1, {enabled: true});
