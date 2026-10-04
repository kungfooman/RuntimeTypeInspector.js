import {Th} from './jsx.js';
/**
 * Header cell for the warning table.
 * @param {string} text - The text.
 * @returns {HTMLTableCellElement} - The header cell.
 * @example
 * createTableHead('Value'); // TH element with 'Value'
 */
function createTableHead(text) {
  return Th({}, text);
}
export {createTableHead};
