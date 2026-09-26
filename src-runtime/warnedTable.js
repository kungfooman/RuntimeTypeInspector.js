import {Table, Tr, Th} from './jsx.js';
/**
 * @param {string} text - The text.
 * @returns {HTMLTableCellElement} - The header cell.
 */
function createTableHead(text) {
  return Th({}, text);
}
function createTable() {
  if (typeof document === 'undefined') {
    return null;
  }
  const descs = ['Hide', 'Debug', 'Hits', 'Loc', 'Name', 'Expect', 'Value', 'Message'];
  return Table({},
               Tr({}, ...descs.map(createTableHead))
  );
}
export {createTableHead, createTable};
