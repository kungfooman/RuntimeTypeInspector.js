import {Warning} from '../src-runtime/Warning.js';
import {installFakeBrowser} from './installFakeBrowser.js';
/**
 * Builds a warning row for `value` under the fake DOM.
 * @param {*} value - The value to display.
 * @returns {{warn: object, restore: Function}} Row and restore fn.
 */
function warningFor(value) {
  const restore = installFakeBrowser();
  const warn = new Warning('msg', 'value', 'expect', 'loc', 'name');
  warn.value = value;
  return {warn, restore};
}
export {warningFor};
