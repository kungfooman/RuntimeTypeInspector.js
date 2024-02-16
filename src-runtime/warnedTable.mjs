/**
 * @param {string} text - The text.
 * @returns {HTMLTableCellElement} - The header cell.
 */
function createTableHead(text) {
  const th = document.createElement('th');
  th.innerText = text;
  return th;
}
function createTable() {
  if (typeof document === 'undefined') {
    return null;
  }
  const table = document.createElement('table');
  const tr = document.createElement('tr');
  const descs = ['Hide', 'Debug', 'Hits', 'Loc', 'Name', 'Expect', 'Value', 'Message'];
  const ths = descs.map(createTableHead);
  tr.append(...ths);
  table.append(tr);
  //table.style.maxHeight = '200px';
  //table.style.overflow = 'scroll';
  //table.style.textWrap = 'nowrap';
  return table;
}
const warnedTable = createTable();
export {createTableHead, createTable, warnedTable};
